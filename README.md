# @peddleswap/sdk

Addresses, ABIs and chain definitions for [PeddleSwap](https://peddleswap.xyz) — a
Uniswap V2 + V3 exchange with token and LP lockers.

Two deployments ship here:

| Chain | Id | Deployed at block |
|---|---|---|
| Robinhood Chain | `4663` | `61044184` |
| Sepolia | `11155111` | `11672286` |

Everything is generated from the contracts repo's own build output — addresses from the
deploy broadcast's record, ABIs from solc, CREATE2 init code hashes from the deployed
creation bytecode. Nothing is transcribed by hand, so nothing here can drift from the
chain without the build failing.

```sh
npm install @peddleswap/sdk viem
```

`viem` is a peer dependency; bring your own so you don't end up with two copies.

## Quick start

```ts
import { createPublicClient, http } from "viem";
import { addresses, chains, quoterV2Abi } from "@peddleswap/sdk";

const client = createPublicClient({ chain: chains[4663], transport: http() });

const { result } = await client.simulateContract({
  address: addresses[4663].quoterV2,
  abi: quoterV2Abi,
  functionName: "quoteExactInputSingle",
  args: [{
    tokenIn: addresses[4663].weth9,
    tokenOut: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168", // USDG
    amountIn: 10n ** 18n,
    fee: 3000,
    sqrtPriceLimitX96: 0n,
  }],
});
```

`QuoterV2` reverts to return its answer, so it is called with `simulateContract`, not
`readContract`. That is Uniswap's design, not a quirk of this package.

## Pool addresses

Pool addresses are pure functions of the tokens and the fee, so compute them instead of
asking the chain. This works for a pool that does not exist yet, which is what you need
when quoting a first deposit.

```ts
import { computeV3PoolAddress, computeV2PairAddress, FEE_TIERS } from "@peddleswap/sdk";

computeV3PoolAddress(4663, tokenA, tokenB, 3000); // argument order does not matter
computeV2PairAddress(4663, tokenA, tokenB);
```

### If you are deriving addresses yourself, read this

**PeddleSwap V3 salts its pools against the pool deployer, not the factory.** The factory
would exceed the contract size limit if it carried the pool creation code, so a separate
`PeddleSwapV3PoolDeployer` does the deploying. Upstream Uniswap V3 uses the factory, and
so does every tutorial and helper library you will find.

Using the factory does not throw. You get a well-formed address that no contract was ever
deployed to, and the failure shows up much later as reads returning zeroes or a swap
reverting for no visible reason. `computeV3PoolAddress` handles this; the raw pieces are
exported if you need them:

```ts
import { addresses, initCodeHashes } from "@peddleswap/sdk";

addresses[4663].v3PoolDeployer; // the CREATE2 deployer for V3 pools
addresses[4663].v3Factory;      // NOT the CREATE2 deployer
initCodeHashes.v3Pool;          // keccak256 of the pool creation bytecode
```

V2 is the ordinary case: its factory deploys its own pairs, so pairs salt against
`v2Factory` with `initCodeHashes.v2Pair`.

The V3 salt is `abi.encode(token0, token1, fee)` — padded, 96 bytes. The V2 salt is
`abi.encodePacked(token0, token1)` — 40 bytes. They are not interchangeable.

## Fee tiers

All four are enabled on both chains, verified against the live factory:

| Fee | Tier | Tick spacing |
|---|---|---|
| `100` | 0.01% | 1 |
| `500` | 0.05% | 10 |
| `3000` | 0.30% | 60 |
| `10000` | 1.00% | 200 |

```ts
import { FEE_TIERS, tickSpacings } from "@peddleswap/sdk";
```

## Contracts that exist on one chain and not the other

The two deployments are not identical, and the address map is typed per chain to match.
Limit orders and the launchpad fee splitter are on Sepolia only:

```ts
addresses[11155111].limitOrders; // fine
addresses[4663].limitOrders;     // compile error — not deployed there
```

That is deliberate. A flat `Record<string, Address>` would let the second line compile and
hand back `undefined`, which in a transaction builder becomes an approval or a fill sent to
the zero address. Better a red squiggle than a lost transaction.

Superseded contracts are **not** published here. Sepolia's deploy record keeps a
`lockerERC721Legacy` address, because the lockers have no proxy and no admin unlock by
design — a replaced locker keeps custody of what was locked in it forever, so that address
is the only record of where those assets are. It is omitted from this package because the
ABI shipped here does not decode it: that contract predates the `collectFeeBps` field, so
its `getLock` returns six words where `lockerERC721Abi` declares seven. Migration across a
supersession is application logic and needs an ABI this package cannot vouch for.

## Indexing Robinhood Chain

Two things will cost you a day if nobody tells you.

**`block.number` inside a contract is not the same numbering space as `eth_blockNumber`
and `eth_getLogs`.** They sit roughly 35 million apart on chain 4663. Range log queries
against `eth_blockNumber`; never against a block number read out of a contract.
`deploymentBlock[4663]` is in the `eth_blockNumber` space, which is the one you want for a
backfill.

**Not every public endpoint serves a wide `eth_getLogs`.** All seven in
`chains[4663].rpcUrls` answer `eth_call`; `robinhood.drpc.org` failed every attempt at a
5000-block log range when each was measured three times, so it is ordered last. The list
is in measured order, not alphabetical.

## What's exported

- `addresses`, `SupportedChainId`, `AddressesFor` — per-chain, typed
- `chains`, `robinhood`, `sepolia`, `deploymentBlock` — viem chain definitions
- `computeV3PoolAddress`, `computeV2PairAddress`, `sortTokens` — CREATE2 derivation
- `FEE_TIERS`, `tickSpacings`, `FeeAmount`
- `initCodeHashes`
- 19 ABIs, each `as const` so viem infers argument and return types:
  `v2FactoryAbi`, `v2RouterAbi`, `v2PairAbi`, `v3FactoryAbi`, `v3PoolAbi`,
  `swapRouterAbi`, `swapRouter02Abi`, `positionManagerAbi`, `quoterAbi`, `quoterV2Abi`,
  `mixedRouteQuoterAbi`, `tickLensAbi`, `tokenValidatorAbi`, `interfaceMulticallAbi`,
  `dynamicFeeModuleAbi`, `lockerERC20Abi`, `lockerERC721Abi`, `feeRouterAbi`,
  `tokenFactoryAbi`

## Verification

All 20 mainnet contracts are verified on Sourcify:
`https://sourcify.dev/server/v2/contract/4663/<address>`.

## Development

```sh
npm install
npm run gen        # regenerate src/generated from ../../contracts
npm run build
npm test
```

`npm run gen` reads `../../contracts/out` and `../../contracts/deployments`, so a clone
needs `forge build` to have been run in `contracts/` first.

The tests are cross-checks, not self-checks. `pool.test.ts` compares the derivation
against vectors produced by `contracts/script/PrintPoolAddresses.s.sol`, which mirrors the
Solidity the routers run. `initCodeHash.test.ts` reads the hardcoded constants back out of
`PeddleSwapV2Library.sol` and `PoolAddress.sol` and asserts the generated values still
match — so if the pair or pool bytecode ever moves without those literals being updated,
this package's build is what catches it.

## License

MIT
