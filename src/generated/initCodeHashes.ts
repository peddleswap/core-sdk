/**
 * CREATE2 init code hashes, keccak256 of each contract's creation bytecode.
 *
 * GENERATED FILE -- do not edit. Run `npm run gen` in packages/sdk.
 *
 * Source of truth is the repository itself: addresses from
 * contracts/deployments/<chainId>.json, written by Deploy.s.sol during the broadcast, and
 * ABIs from contracts/out/, the solc output for the bytecode that was actually deployed.
 * Editing this file by hand reintroduces exactly the drift generating it prevents.
 */

export const initCodeHashes = {
  v2Pair: "0x7c8c9fb83e1273b6ef6cfc8e6b8fe5721d9d874b30cf826817a1d98041ee18b8",
  v3Pool: "0x84245d4aff860637ef99f42475f550352432d38e8e7a5b517763927c4f7e16f5",
} as const;
