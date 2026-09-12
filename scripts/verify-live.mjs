/**
 * Check every shipped address against the live chain, using the ABI shipped for it.
 *
 * WHY THIS IS A SCRIPT AND NOT A TEST
 *
 * It needs network access. A unit test that fails when an RPC has a bad minute trains
 * people to ignore test failures, which costs more than this check earns. So it is a
 * command you run deliberately -- before publishing, and after any redeploy.
 *
 *     npm run build && node scripts/verify-live.mjs        # both chains
 *     npm run build && node scripts/verify-live.mjs 4663   # one chain
 *
 * WHAT IT ACTUALLY PROVES
 *
 * The generator guarantees the ABIs match the compiled artifacts. It cannot guarantee the
 * artifacts match what is at the addresses -- that would need a redeploy to go wrong, or a
 * deployment record to name the wrong address, and neither is hypothetical. Two things are
 * checked here that nothing offline can:
 *
 *  1. A distinctive read on each contract using the ABI this package ships for it. A
 *     mismatch either fails to encode or returns something undecodable.
 *
 *  2. The cross-references AGREE with the shipped addresses. Every periphery contract
 *     stores the factory it was constructed against, so `v2Router.factory()` must equal
 *     `addresses[id].v2Factory`. That is the check that catches a deployment record which
 *     lists a router from one deploy and a factory from another -- both addresses hold
 *     real, working contracts, every ABI matches, and quotes still come back. They are
 *     just quotes from a different exchange than the one being pointed at.
 */

import { createPublicClient, http } from "viem";

// Imported from the BUILT package, not from src: plain node cannot load TypeScript, and
// more to the point, dist is what gets published. Checking the sources would leave the
// bundler between the thing verified and the thing shipped. Run `npm run build` first.
import * as sdk from "../dist/index.js";

const { addresses, chains } = sdk;
/** The ABIs sit on the same namespace as everything else; PROBES looks them up by name. */
const abis = sdk;

/**
 * `[addressKey, abiName, functionName, expectedAddressKey?]`
 *
 * When the fourth element is present the returned value must equal that address in the
 * shipped map; otherwise the read only has to succeed.
 */
const PROBES = [
  ["v2Factory", "v2FactoryAbi", "feeToSetter"],
  ["v2Router", "v2RouterAbi", "factory", "v2Factory"],
  ["v2Router", "v2RouterAbi", "WETH", "weth9"],
  ["v3Factory", "v3FactoryAbi", "poolDeployer", "v3PoolDeployer"],
  ["swapRouter", "swapRouterAbi", "factory", "v3Factory"],
  ["swapRouter", "swapRouterAbi", "WETH9", "weth9"],
  ["swapRouter02", "swapRouter02Abi", "factoryV2", "v2Factory"],
  ["swapRouter02", "swapRouter02Abi", "factory", "v3Factory"],
  ["swapRouter02", "swapRouter02Abi", "positionManager", "positionManager"],
  ["positionManager", "positionManagerAbi", "factory", "v3Factory"],
  ["positionManager", "positionManagerAbi", "WETH9", "weth9"],
  ["quoter", "quoterAbi", "factory", "v3Factory"],
  ["quoterV2", "quoterV2Abi", "factory", "v3Factory"],
  ["mixedRouteQuoter", "mixedRouteQuoterAbi", "factory", "v3Factory"],
  ["tokenValidator", "tokenValidatorAbi", "factoryV2", "v2Factory"],
  ["tokenValidator", "tokenValidatorAbi", "positionManager", "positionManager"],
  ["dynamicFeeModule", "dynamicFeeModuleAbi", "factory", "v3Factory"],
  ["dynamicFeeModule", "dynamicFeeModuleAbi", "defaultFeeCap"],
  ["lockerERC20", "lockerERC20Abi", "lockFee"],
  ["lockerERC721", "lockerERC721Abi", "lockFee"],
  ["feeRouter", "feeRouterAbi", "owner"],
  ["tokenFactory", "tokenFactoryAbi", "allTokensLength"],
];

/** No zero-argument views to read, so the most that can be checked is that code exists. */
const CODE_ONLY = ["tickLens", "interfaceMulticall", "weth9", "tokenDescriptor", "v3PoolDeployer"];

const requested = process.argv[2];
const chainIds = requested ? [Number(requested)] : Object.keys(addresses).map(Number);

let failures = 0;

for (const id of chainIds) {
  const a = addresses[id];
  if (!a) {
    console.error(`no addresses for chain ${id}`);
    process.exitCode = 1;
    continue;
  }
  const client = createPublicClient({ chain: chains[id], transport: http() });

  const live = await client.getChainId();
  console.log(`\n=== chain ${id} (${chains[id].name}) ===`);
  if (live !== id) {
    console.log(`FAIL  endpoint reports chain ${live}, not ${id}`);
    failures++;
    continue;
  }

  let pass = 0;
  for (const [key, abiName, fn, expectKey] of PROBES) {
    const address = a[key];
    if (!address) {
      console.log(`skip  ${key.padEnd(17)} not deployed on ${id}`);
      continue;
    }
    try {
      const value = await client.readContract({ address, abi: abis[abiName], functionName: fn });
      if (expectKey) {
        const expected = a[expectKey];
        if (String(value).toLowerCase() !== String(expected).toLowerCase()) {
          console.log(`FAIL  ${key.padEnd(17)} ${fn}() = ${value}, expected ${expectKey} ${expected}`);
          failures++;
          continue;
        }
        console.log(`ok    ${key.padEnd(17)} ${fn}() == ${expectKey}`);
      } else {
        console.log(`ok    ${key.padEnd(17)} ${fn}() = ${value}`);
      }
      pass++;
    } catch (error) {
      console.log(`FAIL  ${key.padEnd(17)} ${fn}() -> ${String(error).split("\n")[0]}`);
      failures++;
    }
  }

  for (const key of CODE_ONLY) {
    const address = a[key];
    if (!address) continue;
    const code = await client.getCode({ address });
    if (code && code !== "0x") {
      console.log(`ok    ${key.padEnd(17)} has code`);
      pass++;
    } else {
      console.log(`FAIL  ${key.padEnd(17)} NO CODE at ${address}`);
      failures++;
    }
  }

  console.log(`${pass} passed`);
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed. Do not publish.`);
  process.exit(1);
}
console.log("\nall live checks passed");
