/**
 * ABI for tokenFactory, from contracts/out/PeddleTokenFactory.sol/PeddleTokenFactory.json.
 *
 * GENERATED FILE -- do not edit. Run `npm run gen` in packages/sdk.
 *
 * Source of truth is the repository itself: addresses from
 * contracts/deployments/<chainId>.json, written by Deploy.s.sol during the broadcast, and
 * ABIs from contracts/out/, the solc output for the bytecode that was actually deployed.
 * Editing this file by hand reintroduces exactly the drift generating it prevents.
 */

export const tokenFactoryAbi = [
  {
    "type": "function",
    "name": "allTokens",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
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
    "name": "allTokensLength",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "createToken",
    "inputs": [
      {
        "name": "name_",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "symbol_",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "totalSupply_",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "recipient",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "creatorTreasury",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "salt",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "isPeddleToken",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "predictAddress",
    "inputs": [
      {
        "name": "creator",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "salt",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "name_",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "symbol_",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "totalSupply_",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "recipient",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "creatorTreasury",
        "type": "address",
        "internalType": "address"
      }
    ],
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
    "name": "tokensByCreator",
    "inputs": [
      {
        "name": "creator",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "tokensByCreatorLength",
    "inputs": [
      {
        "name": "creator",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "TokenCreated",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "creator",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "creatorTreasury",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "name",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "symbol",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "totalSupply",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "EmptyName",
    "inputs": []
  },
  {
    "type": "error",
    "name": "EmptySymbol",
    "inputs": []
  },
  {
    "type": "error",
    "name": "TokenAlreadyDeployed",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "ZeroAddress",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ZeroSupply",
    "inputs": []
  }
] as const;
