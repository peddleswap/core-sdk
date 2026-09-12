/**
 * @peddleswap/sdk -- addresses, ABIs and chain definitions for PeddleSwap.
 *
 * Two deployments ship here: Robinhood Chain mainnet (4663) and Sepolia (11155111).
 *
 * Everything under `./generated` is emitted by `scripts/generate.mjs` from the contracts
 * repo's own build output -- addresses from the deploy broadcast's record, ABIs from solc,
 * and the CREATE2 init code hashes from the deployed creation bytecode. None of it is
 * transcribed by hand, so none of it can drift from the chain without the build noticing.
 */

export { addresses, type SupportedChainId, type AddressesFor } from "./generated/addresses.js";
export { initCodeHashes } from "./generated/initCodeHashes.js";
export * from "./generated/abis.js";

export { chains, deploymentBlock, robinhood, sepolia } from "./chains.js";

export {
  FEE_TIERS,
  computeV2PairAddress,
  computeV3PoolAddress,
  sortTokens,
  tickSpacings,
  type FeeAmount,
} from "./pool.js";
