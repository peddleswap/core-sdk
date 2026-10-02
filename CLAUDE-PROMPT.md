# Integrate PeddleSwap with Claude

Copy the prompt below into Claude (Claude Code, claude.ai, or any assistant that can read
your repository). It tells the assistant exactly how `@peddleswap/sdk` works on every
chain PeddleSwap is deployed to, and the handful of traps that are specific to PeddleSwap,
so the integration it writes is correct the first time.

Fill in the one line in brackets with what you are building, and paste.

---

```text
You are integrating PeddleSwap into this project using the `@peddleswap/sdk` npm package
(TypeScript, viem peer dependency). Read this whole brief before writing code.

WHAT I AM BUILDING
[Describe your feature, e.g. "a swap widget", "show a token's PeddleSwap pools", "let users lock LP tokens".]

SETUP
- Install: `npm install @peddleswap/sdk viem`.
- Everything comes from the package root:
  import { addresses, chains, supportedChainIds, isSupportedChain, deploymentBlock,
           computeV3PoolAddress, computeV2PairAddress, sortTokens, FEE_TIERS, tickSpacings,
           initCodeHashes, quoterV2Abi, swapRouter02Abi, v2RouterAbi, v2FactoryAbi,
           v2PairAbi, v3FactoryAbi, v3PoolAbi, positionManagerAbi, lockerERC20Abi,
           lockerERC721Abi, weth9Abi, feeRouterAbi, limitOrdersAbi, tokenFactoryAbi }
    from "@peddleswap/sdk";
- Build one viem client per chain from the package's own chain objects, which carry tested
  RPC lists and Multicall3: `createPublicClient({ chain: chains[id], transport: http() })`.

CHAINS - support all of them, never hard-code one
- Deployed: Robinhood Chain 4663, Base 8453, Arc 5042, Sepolia 11155111 (testnet). Iterate
  `supportedChainIds` instead of listing ids, so a chain added in a later SDK version works
  without code changes. `chains` also includes Anubis 6714, which is registered but NOT
  deployed; only `isSupportedChain(id)` decides whether PeddleSwap contracts exist there.
- `addresses[chainId]` is typed per chain. A `number` from a wallet (useChainId, wallet
  events) must be narrowed with `if (!isSupportedChain(chainId)) ...` first. Never write
  `addresses[chainId as SupportedChainId]`: on an unsupported chain it yields undefined and
  a transaction can go to the zero address.
- Not every contract is on every chain. Check with `"key" in addresses[id]`:
    tokenFactory (retired launchpad): 4663 and 11155111 only (new launches run on Peddles, @peddles/sdk)
    limitOrders:              8453, 5042 and 11155111 only
  Everything else (v2Factory, v2Router, v3Factory, v3PoolDeployer, positionManager,
  swapRouter02, swapRouter, quoterV2, quoter, mixedRouteQuoter, tickLens, lockerERC20,
  lockerERC721, feeRouter, dynamicFeeModule, v3FeeAdapter, tokenValidator,
  interfaceMulticall, weth9, tokenDescriptor) is on all four.
- Arc 5042: the gas coin is USDC with 18 decimals natively, and the same balance is the
  ERC-20 at 0x3600000000000000000000000000000000000000 with 6. Trade the ERC-20 like any
  token; never mix the two precisions. `addresses[5042].weth9` is PeddleSwap's own wrapped
  USDC (Arc ships none).
- WETH differs per chain: always `addresses[id].weth9`, never a constant.
- Show users which chain each item is on (chain name/logo), and switch the wallet to that
  chain only when they act, not when they browse.

QUOTES AND SWAPS (V3)
- Quote with QuoterV2 via `simulateContract` (it reverts to return data; `readContract`
  fails): functionName "quoteExactInputSingle",
  args [{ tokenIn, tokenOut, amountIn, fee, sqrtPriceLimitX96: 0n }].
- Fee tiers: `FEE_TIERS` is a list of `{ fee, tickSpacing, label }` for fees 100, 500,
  3000 and 10000 (0.01/0.05/0.30/1.00%); all four are enabled on every chain. Quote each
  tier (or only tiers whose pool exists) and pick the best output.
- Swap with SwapRouter02 `exactInputSingle({ tokenIn, tokenOut, fee, recipient, amountIn,
  amountOutMinimum, sqrtPriceLimitX96: 0n })`. This router has NO deadline in the struct:
  wrap the call in `multicall(uint256 deadline, bytes[] data)` to enforce one. Set
  amountOutMinimum from the quote minus the user's slippage; never 0 in production.
- Approve the ERC20 to `addresses[id].swapRouter02` first. For native ETH in, send value
  and use weth9 as tokenIn; for native ETH out, add `unwrapWETH9` in the same multicall.

V2
- Router `addresses[id].v2Router`: `getAmountsOut(amountIn, path)` to quote,
  `swapExactTokensForTokens(amountIn, amountOutMin, path, to, deadline)` to swap. 0.30% fee.

POOL ADDRESSES - compute, don't guess
- `computeV3PoolAddress(chainId, tokenA, tokenB, fee)` and
  `computeV2PairAddress(chainId, tokenA, tokenB)`; token order does not matter.
- TRAP: PeddleSwap V3 pools are CREATE2-deployed by `v3PoolDeployer`, NOT `v3Factory`.
  Any generic Uniswap helper that salts against the factory returns an address with no
  contract. Use the SDK function, or `initCodeHashes.v3Pool` with `addresses[id].v3PoolDeployer`.
  V2 pairs salt against v2Factory with `initCodeHashes.v2Pair`.
- A computed address may have no code yet (pool not created). Check `getCode` before reading.

LIQUIDITY (V3)
- NonfungiblePositionManager `mint({ token0, token1, fee, tickLower, tickUpper,
  amount0Desired, amount1Desired, amount0Min, amount1Min, recipient, deadline })`; order
  tokens with `sortTokens`, align ticks to `tickSpacings[fee]` (1, 10, 60, 200). Create an empty pool with
  `createAndInitializePoolIfNecessary` first.

LOCKER
- Tokens: lockerERC20 `lock(token, amount, unlockTime, lockOwner)`, payable. LP NFTs:
  lockerERC721 `lock(nft, tokenId, unlockTime, lockOwner)`, payable. unlockTime is a unix
  timestamp in seconds, strictly in the future. Approve the token or NFT to the locker first.
- The fee is paid in the chain's native coin as `msg.value`: read it with `lockFee()` just
  before sending; do not hard-code it (the owner can change it; 0.03 ETH today).
- TRAP: the lockers on Robinhood Chain (4663) and Sepolia predate the fee-token option, so
  `feeToken()` reverts there. On every chain, call it inside try/catch: a revert or the
  zero address both mean the fee is paid in the native coin (ETH on all three today).
- Early unlock always reverts; there is no admin unlock by design.

READING LOGS / INDEXING
- Start backfills at `deploymentBlock[id]`. On Robinhood Chain, `block.number` inside a
  contract is a different numbering from `eth_blockNumber`/`eth_getLogs` (about 35M apart);
  always range logs by `eth_blockNumber`. Keep log ranges at 5,000 blocks or fewer.

QUALITY BAR
- TypeScript strict, no `any` for addresses, no `as` casts on chain ids.
- Handle: unsupported chain, pool not deployed, insufficient allowance/balance, quote
  failure (no liquidity), user rejection, and wrong wallet chain, each with a clear
  message.
- Write tests that call the real contracts read-only (quote a tier, compute a pool address
  and check its code, read lockFee) for EVERY id in supportedChainIds.
- When done, list what you built, how you tested each chain, and anything you could not do.
```

---

## Checking what Claude wrote

The package ships its own live check. From a clone of this repository:

```sh
npm install
npm test                      # unit tests: addresses, ABIs, pool math
npm run verify:live -- 4663   # reads the deployed contracts on Robinhood Chain
npm run verify:live -- 8453   # ...on Base
npm run verify:live -- 11155111
```

If your integration disagrees with `verify:live` about an address or a fee tier, the
package is right: it is generated from the deployment records and checked against the
chain.
