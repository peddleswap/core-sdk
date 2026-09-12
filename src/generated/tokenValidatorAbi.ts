/**
 * ABI for tokenValidator, from contracts/out/TokenValidator.sol/TokenValidator.json.
 *
 * GENERATED FILE -- do not edit. Run `npm run gen` in packages/sdk.
 *
 * Source of truth is the repository itself: addresses from
 * contracts/deployments/<chainId>.json, written by Deploy.s.sol during the broadcast, and
 * ABIs from contracts/out/, the solc output for the bytecode that was actually deployed.
 * Editing this file by hand reintroduces exactly the drift generating it prevents.
 */

export const tokenValidatorAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_factoryV2",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_positionManager",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "batchValidate",
    "inputs": [
      {
        "name": "tokens",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "baseTokens",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "amountToBorrow",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "isFotResults",
        "type": "uint8[]",
        "internalType": "enum ITokenValidator.Status[]"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "factoryV2",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "peddleSwapV2Call",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "amount0",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "data",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "positionManager",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "validate",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "baseTokens",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "amountToBorrow",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "enum ITokenValidator.Status"
      }
    ],
    "stateMutability": "nonpayable"
  }
] as const;
