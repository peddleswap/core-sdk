import {
  encodeAbiParameters,
  encodePacked,
  getAddress,
  keccak256,
  type Address,
} from "viem";

import { addresses, type SupportedChainId } from "./generated/addresses.js";
import { initCodeHashes } from "./generated/initCodeHashes.js";

/**
 * Pool and pair addresses, computed locally.
 *
 * Both exchanges deploy their pools with CREATE2, so every pool address is a pure function
 * of the tokens and the fee. Computing it beats asking the chain: no round trip, it works
 * for a pool that does not exist yet (which is exactly what you need when quoting a first
 * deposit), and it cannot be served stale by a lagging RPC.
 *
 * THE ONE THING TO GET RIGHT: V3 DERIVES FROM THE POOL DEPLOYER, NOT THE FACTORY
 *
 * Upstream Uniswap V3 salts its pools against the factory, and every tutorial, helper and
 * forum answer therefore says "factory". PeddleSwap's V3 factory does not deploy pools --
 * a separate `PeddleSwapV3PoolDeployer` contract does, because the factory would otherwise
 * exceed the contract size limit. So the CREATE2 deployer is the pool deployer, and
 * `computeV3PoolAddress` below uses `addresses[chainId].v3PoolDeployer`.
 *
 * Passing the factory address instead does not throw. It returns a well-formed address
 * that no contract has ever been deployed to, and the failure surfaces much later as a
 * read returning zeroes or a swap reverting for no visible reason. This function exists
 * mostly so that nobody has to know any of that.
 *
 * V2 is the ordinary case: its factory does deploy its own pairs, so the pair salts
 * against the factory.
 */

/** The fee tiers enabled on both deployments, with the tick spacing each carries. */
export const FEE_TIERS = [
  { fee: 100, tickSpacing: 1, label: "0.01%" },
  { fee: 500, tickSpacing: 10, label: "0.05%" },
  { fee: 3000, tickSpacing: 60, label: "0.30%" },
  { fee: 10000, tickSpacing: 200, label: "1.00%" },
] as const;

/** A fee tier that exists on chain. Anything else has no pool and no tick spacing. */
export type FeeAmount = (typeof FEE_TIERS)[number]["fee"];

/** Tick spacing per fee tier, as the factory reports it. */
export const tickSpacings = {
  100: 1,
  500: 10,
  3000: 60,
  10000: 200,
} as const satisfies Record<FeeAmount, number>;

/**
 * Sort two token addresses the way the pools do.
 *
 * Pool identity is defined over the ordered pair, so `(WETH, USDC)` and `(USDC, WETH)` are
 * the same pool and must hash to the same salt. The comparison is numeric on the address,
 * which means it has to happen on a consistent case -- comparing a checksummed string
 * against a lowercase one compares ASCII, not value, and silently yields the wrong order
 * for roughly half of all pairs. Hence the `getAddress` on both sides and the `BigInt`.
 */
export function sortTokens(tokenA: Address, tokenB: Address): [Address, Address] {
  const a = getAddress(tokenA);
  const b = getAddress(tokenB);
  if (a === b) throw new Error(`sortTokens: identical addresses (${a})`);
  return BigInt(a) < BigInt(b) ? [a, b] : [b, a];
}

function create2(
  deployer: Address,
  salt: `0x${string}`,
  initCodeHash: `0x${string}`,
): Address {
  const hash = keccak256(
    encodePacked(
      ["bytes1", "address", "bytes32", "bytes32"],
      ["0xff", deployer, salt, initCodeHash],
    ),
  );
  return getAddress(`0x${hash.slice(-40)}`);
}

/**
 * The address of a V3 pool, whether or not it has been created.
 *
 * A pool that does not exist yet returns an address with no code -- check with `getCode`,
 * or call `v3Factory.getPool`, if you need to know which. The address is correct either
 * way, which is what makes this usable for quoting a pool before anyone has funded it.
 */
export function computeV3PoolAddress(
  chainId: SupportedChainId,
  tokenA: Address,
  tokenB: Address,
  fee: FeeAmount,
): Address {
  const [token0, token1] = sortTokens(tokenA, tokenB);
  // abi.encode -- every field padded to 32 bytes, 96 in total -- NOT encodePacked, which
  // the V2 path below does use. The two are not interchangeable, and reaching for the
  // wrong one produces a perfectly plausible address that holds no contract.
  const salt = keccak256(
    encodeAbiParameters(
      [{ type: "address" }, { type: "address" }, { type: "uint24" }],
      [token0, token1, fee],
    ),
  );
  return create2(addresses[chainId].v3PoolDeployer, salt, initCodeHashes.v3Pool);
}

/** The address of a V2 pair, whether or not it has been created. */
export function computeV2PairAddress(
  chainId: SupportedChainId,
  tokenA: Address,
  tokenB: Address,
): Address {
  const [token0, token1] = sortTokens(tokenA, tokenB);
  // Packed here, deliberately: the V2 factory salts on abi.encodePacked(token0, token1),
  // which is 40 bytes, not the 64 abi.encode would produce.
  const salt = keccak256(encodePacked(["address", "address"], [token0, token1]));
  return create2(addresses[chainId].v2Factory, salt, initCodeHashes.v2Pair);
}
