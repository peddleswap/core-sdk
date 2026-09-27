import { defineChain } from "viem";
import { base as viemBase, sepolia as viemSepolia } from "viem/chains";

import { addresses, type SupportedChainId } from "./generated/addresses.js";

/**
 * The chains this package ships contracts for.
 *
 * Re-exported as viem `Chain` objects so a consumer can hand them straight to
 * `createPublicClient` or wagmi without restating an RPC URL or a currency.
 *
 * WHY THE RPC LIST IS ORDERED THE WAY IT IS
 *
 * Robinhood Chain has seven working public endpoints. The order below is not arbitrary and
 * not alphabetical: it is the order they placed when each was measured three times for
 * `eth_getLogs` over a 5000-block range. Every one of them can serve `eth_call`; only some
 * can serve a log query that wide, and `robinhood.drpc.org` failed all three attempts.
 *
 * That matters here because it used to be first. Any consumer reading events -- which is
 * most of what an SDK gets used for beyond quoting -- would have had every log query fail
 * on the primary and only succeed on the fallback, turning one round trip into two. It is
 * last now.
 *
 * Two further endpoints were probed and are absent rather than ranked low: one answered a
 * JSON-RPC error, the other a bot-challenge page. A dead entry in a fallback list is not
 * free -- it is a timeout every consumer pays before moving on.
 *
 * A NOTE ON BLOCK NUMBERS, IF YOU INDEX THIS CHAIN
 *
 * On chain 4663 the `block.number` an EVM call observes is NOT in the same numbering space
 * as `eth_blockNumber` and `eth_getLogs` -- they sit roughly 35 million apart. Range your
 * log queries against `eth_blockNumber`, never against a block number read from inside a
 * contract. `deploymentBlock` below is in the `eth_blockNumber` space, which is the one
 * you want for a backfill.
 */
export const robinhood = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        "https://rpc.mainnet.chain.robinhood.com",
        "https://rpc.ordofi.network",
        "https://rpc-robinhood.blockmachine.io",
        "https://robinhood.api.pocket.network",
        "https://robinhood.rpc.blxrbdn.com",
        "https://robinhood-rpc.publicnode.com",
        "https://robinhood.drpc.org",
      ],
    },
  },
  // Etherscan is Robinhood Chain's official explorer (Etherscan's own chain list: 4663,
  // robin.etherscan.io). Blockscout also indexes the chain and stays listed.
  blockExplorers: {
    default: { name: "Etherscan", url: "https://robin.etherscan.io", apiUrl: "https://api.etherscan.io/v2/api?chainid=4663" },
    blockscout: { name: "Blockscout", url: "https://robinhoodchain.blockscout.com" },
  },
  contracts: {
    /**
     * Canonical Multicall3, confirmed deployed at the usual address on this chain --
     * `eth_getCode` returns 7618 bytes and `getBlockNumber()` answers.
     *
     * Declaring it is not cosmetic. viem only batches `readContract` calls through
     * multicall when the chain object says where multicall lives; without this, a
     * consumer reading twenty pools pays twenty round trips instead of one, and nothing
     * warns them. viem's own `sepolia` carries this, so omitting it here would have made
     * mainnet quietly slower than the testnet.
     *
     * `blockCreated` is deliberately absent rather than guessed. It is optional, and it
     * only matters for historical reads at blocks before the contract existed. Finding it
     * needs an archive node or the explorer's API -- the public endpoints here are not
     * archival, and the explorer is behind a bot challenge. A wrong number would be worse
     * than none: viem would skip batching for a range where multicall was in fact
     * available, or batch into a block where it was not.
     *
     * WATCH OUT: `getBlockNumber()` on this contract returns the EVM's `block.number`,
     * which on chain 4663 is a different numbering space from `eth_blockNumber` -- 25.9M
     * against 61.0M when this was written. That is not a bug in multicall.
     */
    multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" },
  },
  testnet: false,
});

/**
 * Sepolia, with working RPC endpoints.
 *
 * This started as a plain re-export of viem's `sepolia`, which was wrong in a way that
 * only showed up under load: viem's default transport for it is
 * `https://11155111.rpc.thirdweb.com`, a public-good endpoint that answers 429 after a
 * handful of calls. The README's own quick-start example hit the limit. Everything else
 * about viem's definition is right, so only `rpcUrls` is replaced.
 *
 * All three below answered `eth_chainId` with 11155111 immediately before being written
 * here, which is this project's standing rule for an RPC list. The list is short because
 * short is what is true: of the four endpoints `api/src/lib/rpcs.ts` carries for Sepolia,
 * three are now dead or paywalled -- `sepolia.drpc.org` answers "chain is not available
 * on free plan", `1rpc.io/sepolia` reports its usage limit, and `rpc.sepolia.org` 404s.
 * Six further candidates were probed and are absent because they failed, not because they
 * were overlooked: blastapi 403s, omniatech 521s, and unifra, rockx and subquery do not
 * resolve.
 *
 * thirdweb is last on purpose -- this hostname answers where viem's does not, but it is
 * the same provider and the same rate limit is presumably behind it.
 *
 * `sepolia.gateway.tenderly.co` was here and is gone. It answered when this list was
 * written and failed three consecutive probes a few hours later, which is the whole reason
 * the rule is "probe before writing, and probe again before trusting": an endpoint that
 * worked once is not an endpoint that works.
 */
export const sepolia = defineChain({
  ...viemSepolia,
  rpcUrls: {
    default: {
      http: [
        "https://ethereum-sepolia-rpc.publicnode.com",
        "https://0xrpc.io/sep",
        "https://sepolia.rpc.thirdweb.com",
      ],
    },
  },
});

/**
 * Base mainnet (8453) -- DEPLOYED 2026-09-27 at block 51852483, without the launchpad
 * (`tokenFactory`): token launches on Base are Latch Protocol's.
 *
 * viem's own `base` is right apart from its RPC list, which is the single
 * `mainnet.base.org` -- and that endpoint caps `eth_getLogs` at 2,000 blocks. So only
 * `rpcUrls` is replaced, in the same order as `api/src/lib/rpcs.ts`. Every URL below
 * answered `eth_chainId` with 8453 three times out of three on 2026-09-24; `1rpc.io/base`
 * was probed and is absent because it answered -32001 "usage limit" every time. Only
 * publicnode served a 5000-block `eth_getLogs`; drpc and nodies refuse log ranges on
 * their free plans, so they are tail entries for `eth_call`.
 *
 * Multicall3 is viem's declaration, the canonical address -- confirmed to have code on
 * 8453 the same day.
 */
export const base = defineChain({
  ...viemBase,
  rpcUrls: {
    default: {
      http: [
        "https://base-rpc.publicnode.com",
        "https://mainnet.base.org",
        "https://base.drpc.org",
        "https://base-pokt.nodies.app",
      ],
    },
  },
});

/**
 * Anubis Chain (6714) -- REGISTERED, NOT YET DEPLOYED. viem has no definition for it.
 *
 * Checked live against https://rpc.anubispace.org on 2026-09-24:
 *
 *   - `eth_chainId` returns 6714. It is the only public endpoint the chain publishes.
 *   - The native coin is DAI, and it is ALSO an ERC-20 at
 *     0x83fd06F0846d9D90B3016bF670Efe2E0B11cDe14 (`symbol()` "DAI", `decimals()` 18):
 *     `eth_getBalance` and `balanceOf` return the same number for an account. There is
 *     no separate wrapped native to route through.
 *   - Multicall3 is NOT at the canonical 0xcA11bde0... address -- `eth_getCode` there is
 *     empty. It lives at 0x2BaB3619..., which has code and answers `getBlockNumber()`.
 *     Declaring the canonical address would make every batched read revert.
 *
 * `blockCreated` is omitted for the same reason as on `robinhood`: a guess is worse than
 * nothing.
 */
export const anubis = defineChain({
  id: 6714,
  name: "Anubis Chain",
  nativeCurrency: { name: "Dai", symbol: "DAI", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.anubispace.org"] } },
  blockExplorers: { default: { name: "Anubisscan", url: "https://anubisscan.io" } },
  contracts: {
    multicall3: { address: "0x2BaB36196519Ce9Cc31Bc4899FCBB8124A413b02" },
  },
  testnet: false,
});

/**
 * Every chain this package knows, keyed by id -- deployed or registered.
 *
 * This is a SUPERSET of the chains in `addresses`: Anubis (6714) is here before its
 * contracts are. Having a viem definition says nothing about whether
 * PeddleSwap is deployed there; `isSupportedChain` is the question to ask for that.
 */
export const chains = {
  4663: robinhood,
  11155111: sepolia,
  8453: base,
  6714: anubis,
} as const;

/**
 * The block each deployment landed in, for backfilling logs.
 *
 * Starting a backfill from block 0 on Robinhood Chain means scanning 61 million blocks
 * that provably contain nothing of ours, so this is the number to start from. It is in the
 * `eth_blockNumber` space -- see the note on `robinhood` above, which is a real trap on
 * this chain and has cost this project a wrong value in a committed file once already.
 *
 * WHY SEPOLIA'S NUMBER IS NOT THE ONE IN THE DEPLOYMENT RECORD
 *
 * `contracts/deployments/11155111.json` says 11672286. Every contract this package ships
 * for Sepolia was created at 11680694 or later -- verified against the broadcast receipts
 * in `contracts/broadcast/Deploy.s.sol/11155111/`, which record the block of each CREATE.
 *
 * 11672286 is the creation block of `lockerERC721Legacy`, the superseded locker. The
 * record carries it forward on purpose: the indexer has to reach that contract's events,
 * because it still holds assets and there is no admin unlock. So the record is right for
 * the record's job.
 *
 * It is the wrong number *here*, because this package deliberately does not publish
 * superseded addresses -- a start block chosen to cover a contract we do not ship is
 * 8,408 blocks of guaranteed-empty scanning for every consumer. The error was in the safe
 * direction, which is why it survived review: too early wastes time, too late loses
 * events. Corrected rather than left, since "safe" is not the same as "right".
 */
export const deploymentBlock = {
  4663: 61044184n,
  11155111: 11680694n,
  // The first CREATE in contracts/broadcast/Deploy.s.sol/8453/run-latest.json. The
  // record's deployBlock (51852483) is the block the script read before broadcasting.
  8453: 51852486n,
  // `satisfies` is the reminder: when a regenerate adds a chain to `addresses` (Anubis,
  // once deployments/6714.json exists), this stops compiling until its block is added.
  // Take it from the broadcast receipts, not blindly from the record's `deployBlock`.
} as const satisfies Record<SupportedChainId, bigint>;

/**
 * Every chain id this package ships addresses for, as a value you can iterate.
 *
 * Derived from the generated `addresses` rather than written out, so a chain that is only
 * registered (see `chains`) is not in it, and a newly deployed one joins it on the next
 * `npm run gen` with no edit here.
 */
export const supportedChainIds: readonly SupportedChainId[] = Object.keys(addresses)
  .map(Number)
  .sort((a, b) => a - b) as SupportedChainId[];

/**
 * Narrow a plain `number` to a chain this package supports.
 *
 * This is the on-ramp the per-chain address typing needs in order to be worth having.
 * `addresses` is keyed by literal chain id so that `addresses[4663].limitOrders` is a
 * compile error rather than an undefined that becomes a transaction to the zero address.
 * The cost is that `addresses[chainId]` does not compile when `chainId: number` -- which
 * is exactly what `useChainId()` and every wallet event hand you.
 *
 * Without a guard the obvious move is `addresses[chainId as SupportedChainId]`, and that
 * cast puts back precisely the hole the typing closed: on an unsupported chain it yields
 * `undefined` and the next property read throws, or worse, spreads into a call as a zero
 * address. So the guard ships, and the README points at it.
 *
 *     if (!isSupportedChain(chainId)) return null;
 *     const router = addresses[chainId].swapRouter02;   // narrowed, no cast
 */
export function isSupportedChain(chainId: number): chainId is SupportedChainId {
  return (supportedChainIds as readonly number[]).includes(chainId);
}
