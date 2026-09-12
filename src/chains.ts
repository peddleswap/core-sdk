import { defineChain } from "viem";
import { sepolia } from "viem/chains";

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
  blockExplorers: {
    default: { name: "Blockscout", url: "https://robinhoodchain.blockscout.com" },
  },
  testnet: false,
});

export { sepolia };

/** Every chain with a PeddleSwap deployment, keyed by id. */
export const chains = {
  4663: robinhood,
  11155111: sepolia,
} as const;

/**
 * The block each deployment landed in, for backfilling logs.
 *
 * Starting a backfill from block 0 on Robinhood Chain means scanning 61 million blocks
 * that provably contain nothing of ours, so this is the number to start from. It is in the
 * `eth_blockNumber` space -- see the note on `robinhood` above, which is a real trap on
 * this chain and has cost this project a wrong value in a committed file once already.
 */
export const deploymentBlock = {
  4663: 61044184n,
  11155111: 11672286n,
} as const;
