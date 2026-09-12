/**
 * ABI for interfaceMulticall, from contracts/out/PeddleSwapInterfaceMulticall.sol/PeddleSwapInterfaceMulticall.json.
 *
 * GENERATED FILE -- do not edit. Run `npm run gen` in packages/sdk.
 *
 * Source of truth is the repository itself: addresses from
 * contracts/deployments/<chainId>.json, written by Deploy.s.sol during the broadcast, and
 * ABIs from contracts/out/, the solc output for the bytecode that was actually deployed.
 * Editing this file by hand reintroduces exactly the drift generating it prevents.
 */

export const interfaceMulticallAbi = [
  {
    "type": "function",
    "name": "getCurrentBlockTimestamp",
    "inputs": [],
    "outputs": [
      {
        "name": "timestamp",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getEthBalance",
    "inputs": [
      {
        "name": "addr",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "balance",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "multicall",
    "inputs": [
      {
        "name": "calls",
        "type": "tuple[]",
        "internalType": "struct PeddleSwapInterfaceMulticall.Call[]",
        "components": [
          {
            "name": "target",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "gasLimit",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "callData",
            "type": "bytes",
            "internalType": "bytes"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "blockNumber",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "returnData",
        "type": "tuple[]",
        "internalType": "struct PeddleSwapInterfaceMulticall.Result[]",
        "components": [
          {
            "name": "success",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "gasUsed",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "returnData",
            "type": "bytes",
            "internalType": "bytes"
          }
        ]
      }
    ],
    "stateMutability": "nonpayable"
  }
] as const;
