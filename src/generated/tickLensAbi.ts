/**
 * ABI for tickLens, from contracts/out/TickLens.sol/TickLens.json.
 *
 * GENERATED FILE -- do not edit. Run `npm run gen` in packages/sdk.
 *
 * Source of truth is the repository itself: addresses from
 * contracts/deployments/<chainId>.json, written by Deploy.s.sol during the broadcast, and
 * ABIs from contracts/out/, the solc output for the bytecode that was actually deployed.
 * Editing this file by hand reintroduces exactly the drift generating it prevents.
 */

export const tickLensAbi = [
  {
    "type": "function",
    "name": "getPopulatedTicksInWord",
    "inputs": [
      {
        "name": "pool",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "tickBitmapIndex",
        "type": "int16",
        "internalType": "int16"
      }
    ],
    "outputs": [
      {
        "name": "populatedTicks",
        "type": "tuple[]",
        "internalType": "struct ITickLens.PopulatedTick[]",
        "components": [
          {
            "name": "tick",
            "type": "int24",
            "internalType": "int24"
          },
          {
            "name": "liquidityNet",
            "type": "int128",
            "internalType": "int128"
          },
          {
            "name": "liquidityGross",
            "type": "uint128",
            "internalType": "uint128"
          }
        ]
      }
    ],
    "stateMutability": "view"
  }
] as const;
