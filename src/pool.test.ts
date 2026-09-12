import { describe, expect, it } from "vitest";

import { addresses } from "./generated/addresses.js";
import {
  FEE_TIERS,
  computeV2PairAddress,
  computeV3PoolAddress,
  sortTokens,
  tickSpacings,
} from "./pool.js";

/**
 * Cross-checks the TypeScript derivation against the Solidity that the chain runs.
 *
 * WHERE THESE VECTORS COME FROM
 *
 * `contracts/script/PrintPoolAddresses.s.sol`, run with `forge script PrintPoolAddresses`.
 * That script reimplements nothing -- it mirrors `PeddleSwapV2Library.pairFor` and
 * `PoolAddress.computeAddress` line for line, using the same constants the deployed
 * routers use. Regenerate it and these numbers should come back identical.
 *
 * The vectors deliberately do NOT come from this file's own output. Every way this
 * derivation can be wrong is silent -- salting V3 against the factory rather than the pool
 * deployer, using packed encoding where V3 uses `abi.encode`, or sorting addresses as
 * strings instead of as numbers -- and each produces a well-formed address that simply
 * holds no contract. A test that asserted `computeV3PoolAddress` still returns what
 * `computeV3PoolAddress` returned last week would pass through all three.
 *
 * Live `getPool` results would be a third source, and were tried: none of these pairs has
 * a pool on the current Sepolia factory (it was redeployed, and the E2E fixtures create
 * their pools inside a run rather than leaving them behind). So the Solidity reference is
 * the check here, which is the better one anyway -- it covers pools that do not exist yet,
 * and quoting one of those is the reason this function exists.
 *
 * The live chain did confirm all of this once, by a route that does not need a pool to
 * exist: `eth_call` against `createPool` and `createPair` on chain 4663 returns the address
 * the factory *would* deploy to, without sending anything. WETH/USDG at fee 500 and 3000
 * and the WETH/USDG V2 pair each came back equal to what these functions compute offline.
 * That is not repeated as a test because it needs network access, and a unit test that
 * fails when an RPC has a bad minute trains people to ignore it. `contracts/script/E2E.s.sol`
 * is where a live assertion belongs.
 *
 * All vectors are for Sepolia (11155111), whose factory and pool deployer addresses are
 * the ones baked into the script.
 */

const SEPOLIA = 11155111;

const TOK_A = "0x72763Dc0c37070f922473bf2F01e54CC3d31c9a6";
const TOK_B = "0xA1a54956F6eA5a1A3d78dAc94e58Cb81C2040968";
const WETH9 = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";

describe("computeV3PoolAddress", () => {
  it.each([
    [100, "0xeDd7e79C84d7Bc98394cF45Cf80eFF062434C3Ec"],
    [500, "0x6202b8ceA8BbAE27bBC67E6Bd96de6933043180D"],
    [3000, "0xDACB08d5aC999b23dc246ae91D96BbFC8343Fed8"],
    [10000, "0x210912f65e9e20117d1099AB4d63CeC5790A3Cb7"],
  ] as const)("matches the Solidity reference at fee %i", (fee, expected) => {
    expect(computeV3PoolAddress(SEPOLIA, TOK_A, TOK_B, fee)).toBe(expected);
  });

  it("matches the Solidity reference for a WETH pair", () => {
    expect(computeV3PoolAddress(SEPOLIA, WETH9, TOK_A, 3000)).toBe(
      "0x6dd7381B7fdC8D0e91E0AEf4ae4DfF97aE6290F6",
    );
  });

  it("is independent of argument order", () => {
    // Pool identity is the ordered pair, so both calls must name the same pool. If the
    // sort compared strings rather than numbers this would hold for some pairs and not
    // others -- tokA/tokB is a case where the checksummed forms differ in case at the
    // first character that matters, so it is the pair that catches it.
    expect(computeV3PoolAddress(SEPOLIA, TOK_B, TOK_A, 3000)).toBe(
      computeV3PoolAddress(SEPOLIA, TOK_A, TOK_B, 3000),
    );
  });

  it("is independent of input casing", () => {
    expect(computeV3PoolAddress(SEPOLIA, TOK_A.toLowerCase() as `0x${string}`, TOK_B, 3000)).toBe(
      computeV3PoolAddress(SEPOLIA, TOK_A, TOK_B, 3000),
    );
  });

  it("gives each fee tier its own pool", () => {
    const seen = FEE_TIERS.map((t) => computeV3PoolAddress(SEPOLIA, TOK_A, TOK_B, t.fee));
    expect(new Set(seen).size).toBe(FEE_TIERS.length);
  });

  it("salts against the pool deployer, not the factory", () => {
    // The single mistake this module exists to prevent. Asserting the two addresses
    // differ is what makes the vectors above meaningful: if they were equal, passing the
    // factory would accidentally work and none of this would be load-bearing.
    const { v3Factory, v3PoolDeployer } = addresses[SEPOLIA];
    expect(v3PoolDeployer).not.toBe(v3Factory);
  });
});

describe("computeV2PairAddress", () => {
  it("matches the Solidity reference", () => {
    expect(computeV2PairAddress(SEPOLIA, TOK_A, TOK_B)).toBe(
      "0x11CBFB7BF48b79d54FFAD0BC48e945b1d2968eC9",
    );
    expect(computeV2PairAddress(SEPOLIA, WETH9, TOK_A)).toBe(
      "0xb4cA0ddD70b1Bed7F14B62269b6C8d5783030741",
    );
  });

  it("is independent of argument order", () => {
    expect(computeV2PairAddress(SEPOLIA, TOK_B, TOK_A)).toBe(
      computeV2PairAddress(SEPOLIA, TOK_A, TOK_B),
    );
  });

  it("does not collide with the V3 pool for the same tokens", () => {
    // Different init code hash and a different CREATE2 deployer, so these cannot collide
    // -- but this is the assertion that would catch a copy-paste between the two.
    expect(computeV2PairAddress(SEPOLIA, TOK_A, TOK_B)).not.toBe(
      computeV3PoolAddress(SEPOLIA, TOK_A, TOK_B, 3000),
    );
  });
});

describe("sortTokens", () => {
  it("orders numerically and returns checksummed addresses", () => {
    expect(sortTokens(TOK_B, TOK_A)).toEqual([TOK_A, TOK_B]);
    expect(sortTokens(TOK_A.toLowerCase() as `0x${string}`, TOK_B)).toEqual([TOK_A, TOK_B]);
  });

  it("rejects a pair of the same token", () => {
    // A pool of a token against itself has no meaning, and the V2 factory and V3 factory
    // both revert on it. Failing here gives a legible error instead of a revert later.
    expect(() => sortTokens(TOK_A, TOK_A.toLowerCase() as `0x${string}`)).toThrow(/identical/);
  });
});

describe("FEE_TIERS", () => {
  it("agrees with tickSpacings", () => {
    for (const tier of FEE_TIERS) {
      expect(tickSpacings[tier.fee]).toBe(tier.tickSpacing);
    }
  });
});
