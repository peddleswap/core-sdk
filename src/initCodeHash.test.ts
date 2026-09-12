import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { initCodeHashes } from "./generated/initCodeHashes.js";

/**
 * The generated init code hashes must still equal the ones hardcoded in Solidity.
 *
 * Two copies of each hash exist and neither can be eliminated. Solidity needs a literal,
 * because a contract cannot cheaply hash its own creation code at runtime. This package
 * generates its copy from the artifacts, so it is always current by construction.
 *
 * That asymmetry is the whole value of this test. If the pair or pool source changes -- or
 * merely if the optimizer settings do, which also moves the bytecode -- the generated hash
 * follows and the Solidity literal does not. Nothing else in the build notices: the
 * contracts compile, the tests pass, and `PeddleSwapV2Library.pairFor` and
 * `PoolAddress.computeAddress` start returning addresses no contract was deployed to.
 * That breaks the routers, which is a live-funds bug on a quiet diff.
 *
 * So this reads the constants back out of the Solidity source rather than restating them,
 * and fails the SDK build when they disagree. The SDK is downstream of the contracts and
 * regenerates on every build, which makes it the cheapest place to keep this alarm.
 */

const CONTRACTS = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "contracts");

/** Pull the first 32-byte hex literal out of a Solidity source file. */
function solidityHash(relPath: string, pattern: RegExp): string {
  const source = readFileSync(join(CONTRACTS, relPath), "utf8");
  const match = source.match(pattern);
  if (!match?.[1]) {
    throw new Error(
      `no init code hash found in ${relPath}. The constant was renamed or removed -- ` +
        `update this test's pattern rather than deleting the assertion.`,
    );
  }
  return `0x${match[1].toLowerCase()}`;
}

describe("init code hashes", () => {
  it("matches the constant in PeddleSwapV2Library.pairFor", () => {
    const inSolidity = solidityHash(
      "src/v2/periphery/libraries/PeddleSwapV2Library.sol",
      /hex'([0-9a-fA-F]{64})'/,
    );
    expect(initCodeHashes.v2Pair).toBe(inSolidity);
  });

  it("matches POOL_INIT_CODE_HASH in PoolAddress", () => {
    const inSolidity = solidityHash(
      "src/v3/periphery/libraries/PoolAddress.sol",
      /POOL_INIT_CODE_HASH\s*=\s*0x([0-9a-fA-F]{64})/,
    );
    expect(initCodeHashes.v3Pool).toBe(inSolidity);
  });

  it("are distinct and well formed", () => {
    // A pasting accident that set both to the same value would still satisfy the two
    // assertions above only if the Solidity carried it too -- but it would sail through
    // any test that merely checked the shape, so check the shape and the distinctness.
    expect(initCodeHashes.v2Pair).toMatch(/^0x[0-9a-f]{64}$/);
    expect(initCodeHashes.v3Pool).toMatch(/^0x[0-9a-f]{64}$/);
    expect(initCodeHashes.v2Pair).not.toBe(initCodeHashes.v3Pool);
  });
});
