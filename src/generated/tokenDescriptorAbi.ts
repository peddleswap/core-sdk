/**
 * ABI for tokenDescriptor, from contracts/out/PeddleSwapV3TokenDescriptor.sol/PeddleSwapV3TokenDescriptor.json.
 *
 * GENERATED FILE -- do not edit. Run `npm run gen` in packages/sdk.
 *
 * Source of truth is the repository itself: addresses from
 * contracts/deployments/<chainId>.json, written by Deploy.s.sol during the broadcast, and
 * ABIs from contracts/out/, the solc output for the bytecode that was actually deployed.
 * Editing this file by hand reintroduces exactly the drift generating it prevents.
 */

export const tokenDescriptorAbi = [
  {
    "type": "function",
    "name": "tokenURI",
    "inputs": [
      {
        "name": "positionManager",
        "type": "address",
        "internalType": "contract INonfungiblePositionManager"
      },
      {
        "name": "tokenId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  }
] as const;
