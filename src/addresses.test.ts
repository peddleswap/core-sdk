import { getAddress, isAddress } from "viem";
import { describe, expect, it } from "vitest";

import { chains, deploymentBlock } from "./chains.js";
import { addresses, type SupportedChainId } from "./generated/addresses.js";

/**
 * Shape checks on the generated address map.
 *
 * These are cheap and they guard the generator, not the deployment. Nothing here can
 * confirm an address holds the right contract -- only the chain can, and
 * `contracts/verification/` is where that lives. What these catch is a generator change
 * that quietly drops a chain, publishes a zero address, emits a lowercase address that
 * then fails a strict `Address` comparison somewhere downstream, or lets a superseded
 * contract back into the published set.
 */

const chainIds = Object.keys(addresses).map(Number) as SupportedChainId[];

/** Contracts a consumer can rely on being present on every supported chain. */
const UNIVERSAL = [
  "v2Factory",
  "v2Router",
  "v3Factory",
  "v3PoolDeployer",
  "swapRouter02",
  "positionManager",
  "quoterV2",
  "lockerERC20",
  "lockerERC721",
  "feeRouter",
  "tokenFactory",
  "weth9",
] as const;

describe("addresses", () => {
  it("ships both chains", () => {
    // Numeric comparator, not the default: `sort()` stringifies, and as strings
    // "11155111" sorts before "4663". The same trap `sortTokens` exists to avoid.
    expect([...chainIds].sort((a, b) => a - b)).toEqual([4663, 11155111]);
  });

  it.each(chainIds)("chain %i has every universal contract", (id) => {
    for (const key of UNIVERSAL) {
      expect(addresses[id], `${id} is missing ${key}`).toHaveProperty(key);
    }
  });

  it.each(chainIds)("chain %i has only valid, checksummed, non-zero addresses", (id) => {
    for (const [key, value] of Object.entries(addresses[id])) {
      expect(isAddress(value), `${id}.${key} is not an address: ${value}`).toBe(true);
      // Checksummed, because consumers compare these to values read off the chain with
      // `===`. A lowercase entry here would mismatch a checksummed one from viem.
      expect(getAddress(value), `${id}.${key} is not checksummed`).toBe(value);
    }
  });

  it("publishes no superseded contract", () => {
    // The deploy record keeps `feeRouterLegacy` and `lockerERC721Legacy` so the assets
    // locked in them are never orphaned, but this package must not ship them: the ABI it
    // ships does not decode the older locker. See the note in scripts/generate.mjs.
    for (const id of chainIds) {
      expect(Object.keys(addresses[id]).filter((k) => /Legacy$/.test(k))).toEqual([]);
    }
  });

  it("gives every chain a viem definition and a deployment block", () => {
    for (const id of chainIds) {
      expect(chains[id].id).toBe(id);
      expect(chains[id].rpcUrls.default.http.length).toBeGreaterThan(0);
      expect(deploymentBlock[id]).toBeGreaterThan(0n);
    }
  });

  it("keeps limit orders off chains that do not have them", () => {
    // Sepolia carries `limitOrders` and `launchpadFee`; Robinhood Chain does not yet. The
    // per-chain object literals make `addresses[4663].limitOrders` a compile error rather
    // than an undefined that becomes a transaction to the zero address. This asserts the
    // runtime half of that; the type half is checked by `tsc` over this file.
    expect(addresses[11155111]).toHaveProperty("limitOrders");
    expect(addresses[4663]).not.toHaveProperty("limitOrders");
  });
});
