import { getAddress, isAddress } from "viem";
import { describe, expect, it } from "vitest";

import * as abis from "./generated/abis.js";
import { chains, deploymentBlock, isSupportedChain, supportedChainIds } from "./chains.js";
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

  it("exports an ABI for every address it publishes", () => {
    // The invariant that replaced a judgement call. An earlier version shipped ABIs only
    // for contracts an integrator was assumed likely to call, and left six addresses with
    // no way to call them -- including `limitOrders`, which is the contract the per-chain
    // typing exists to protect, and `weth9`, where wrapping is the first thing anyone
    // does. A documented exception list needed the same upkeep and would have rotted
    // quietly, so it is asserted instead.
    const missing: string[] = [];
    for (const id of chainIds) {
      for (const key of Object.keys(addresses[id])) {
        if (!(`${key}Abi` in abis)) missing.push(`${id}.${key}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("starts each backfill at or before the earliest contract", () => {
    // Sepolia's deploy record says 11672286, which is the superseded locker's creation
    // block, carried forward on purpose so the indexer can still reach its events. Every
    // contract published here was created at 11680694 or later, verified against the
    // broadcast receipts. Too early only wastes a scan; too late silently loses events,
    // so this asserts the direction as well as the value.
    expect(deploymentBlock[11155111]).toBe(11680694n);
    expect(deploymentBlock[4663]).toBe(61044184n);
  });

  it("narrows a plain number through isSupportedChain", () => {
    // Without this guard the only way to use a chainId from useChainId() is a cast, and
    // `addresses[chainId as SupportedChainId]` puts back exactly the undefined this
    // package's typing exists to prevent.
    const fromWallet: number = 4663;
    expect(isSupportedChain(fromWallet)).toBe(true);
    expect(isSupportedChain(1)).toBe(false);
    expect(isSupportedChain(46630)).toBe(false);
    if (isSupportedChain(fromWallet)) {
      expect(addresses[fromWallet].swapRouter02).toMatch(/^0x[0-9a-fA-F]{40}$/);
    }
    expect([...supportedChainIds].sort((a, b) => a - b)).toEqual([4663, 11155111]);
  });

  it("declares multicall3 so viem can batch", () => {
    // viem only batches readContract through multicall when the chain object says where
    // multicall lives. Robinhood Chain has it at the canonical address; omitting it made
    // twenty pool reads twenty round trips, with nothing to warn the caller.
    expect(chains[4663].contracts?.multicall3?.address).toBe(
      "0xcA11bde05977b3631167028862bE2a173976CA11",
    );
    expect(chains[11155111].contracts?.multicall3?.address).toBeDefined();
  });

  it("registers Base and Anubis without publishing addresses for them", () => {
    // Registered, not deployed: the viem definitions ship so a client can be built, but
    // until contracts/deployments/<id>.json exists and the package is regenerated there
    // is nothing to call, and isSupportedChain must say so. When Base deploys, 8453 moves
    // out of this test and into "ships both chains" above.
    expect(chains[8453].id).toBe(8453);
    expect(chains[6714].id).toBe(6714);
    for (const id of [8453, 6714]) {
      expect(isSupportedChain(id)).toBe(false);
      expect(Object.keys(addresses).map(Number)).not.toContain(id);
      expect(chains[id as 8453 | 6714].rpcUrls.default.http.length).toBeGreaterThan(0);
    }
    // Anubis pays gas in DAI, and its Multicall3 is not at the canonical address.
    expect(chains[6714].nativeCurrency.symbol).toBe("DAI");
    expect(chains[6714].contracts?.multicall3?.address).toBe(
      "0x2BaB36196519Ce9Cc31Bc4899FCBB8124A413b02",
    );
    expect(chains[8453].contracts?.multicall3?.address.toLowerCase()).toBe(
      "0xca11bde05977b3631167028862be2a173976ca11",
    );
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
