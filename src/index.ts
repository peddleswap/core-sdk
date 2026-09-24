/**
 * @peddleswap/sdk -- addresses, ABIs and chain definitions for PeddleSwap.
 *
 * Two deployments ship here: Robinhood Chain mainnet (4663) and Sepolia (11155111).
 * Base (8453) and Anubis Chain (6714) are registered -- their viem definitions ship in
 * `chains` -- but have no addresses until their deploys land; `isSupportedChain` is the
 * gate for that.
 *
 * Everything under `./generated` is emitted by `scripts/generate.mjs` from the contracts
 * repo's own build output -- addresses from the deploy broadcast's record, ABIs from solc,
 * and the CREATE2 init code hashes from the deployed creation bytecode. None of it is
 * transcribed by hand, so none of it can drift from the chain without the build noticing.
 */

export { addresses, type SupportedChainId, type AddressesFor } from "./generated/addresses.js";
export { initCodeHashes } from "./generated/initCodeHashes.js";
export * from "./generated/abis.js";

export {
  anubis,
  base,
  chains,
  deploymentBlock,
  isSupportedChain,
  robinhood,
  sepolia,
  supportedChainIds,
} from "./chains.js";

export {
  FEE_TIERS,
  computeV2PairAddress,
  computeV3PoolAddress,
  sortTokens,
  tickSpacings,
  type FeeAmount,
} from "./pool.js";
