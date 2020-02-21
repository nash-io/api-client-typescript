import { AbiItem } from 'web3-utils'

export const SettlementABI: AbiItem[] = [
  {
    constant: true,
    inputs: [],
    name: 'withdrawalWait',
    outputs: [
      {
        name: '',
        type: 'uint16'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'owner',
    outputs: [
      {
        name: '',
        type: 'address'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'locked',
    outputs: [
      {
        name: '',
        type: 'bool'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: '_newOwner',
        type: 'address'
      }
    ],
    name: 'transferOwnership',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'from',
        type: 'address'
      },
      {
        indexed: false,
        name: 'assetIds',
        type: 'uint16[]'
      },
      {
        indexed: false,
        name: 'amounts',
        type: 'uint64[]'
      }
    ],
    name: 'OnBalanceQuery',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'stateUpdates',
        type: 'bytes'
      }
    ],
    name: 'OnBalancesSync',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'from',
        type: 'address'
      },
      {
        indexed: false,
        name: 'assetFromId',
        type: 'uint16'
      },
      {
        indexed: false,
        name: 'assetToId',
        type: 'uint16'
      },
      {
        indexed: false,
        name: 'assetFromNonce',
        type: 'uint32'
      },
      {
        indexed: false,
        name: 'assetToNonce',
        type: 'uint32'
      },
      {
        indexed: false,
        name: 'orderNonce',
        type: 'uint32'
      },
      {
        indexed: false,
        name: 'actualAmount',
        type: 'uint64'
      },
      {
        indexed: false,
        name: 'actualOrderRate',
        type: 'uint64'
      },
      {
        indexed: false,
        name: 'actualFeeRate',
        type: 'uint64'
      }
    ],
    name: 'OnFillOrder',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'from',
        type: 'address'
      },
      {
        indexed: false,
        name: 'assetId',
        type: 'uint16'
      },
      {
        indexed: false,
        name: 'amount',
        type: 'uint64'
      },
      {
        indexed: false,
        name: 'nonce',
        type: 'uint32'
      },
      {
        indexed: false,
        name: 'userPubKey',
        type: 'address'
      },
      {
        indexed: false,
        name: 'userSig',
        type: 'bytes'
      },
      {
        indexed: false,
        name: 'meSig',
        type: 'bytes'
      }
    ],
    name: 'OnDeposit',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'from',
        type: 'address'
      },
      {
        indexed: false,
        name: 'assetId',
        type: 'uint16'
      },
      {
        indexed: false,
        name: 'amount',
        type: 'uint64'
      },
      {
        indexed: false,
        name: 'nonce',
        type: 'uint32'
      },
      {
        indexed: false,
        name: 'userPubKey',
        type: 'address'
      },
      {
        indexed: false,
        name: 'userSig',
        type: 'bytes'
      },
      {
        indexed: false,
        name: 'meSig',
        type: 'bytes'
      }
    ],
    name: 'OnWithdrawalComplete',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'from',
        type: 'address'
      }
    ],
    name: 'OnInitiateManualWithdrawal',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'from',
        type: 'address'
      },
      {
        indexed: false,
        name: 'assetId',
        type: 'uint16'
      },
      {
        indexed: false,
        name: 'amount',
        type: 'uint64'
      },
      {
        indexed: false,
        name: 'nonce',
        type: 'uint32'
      }
    ],
    name: 'OnManualWithdrawalComplete',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'addr',
        type: 'address'
      }
    ],
    name: 'OnAddedWhitelistAdmin',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'addr',
        type: 'address'
      }
    ],
    name: 'OnRemovedWhitelistAdmin',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'mePubKey',
        type: 'address'
      }
    ],
    name: 'OnAddedMatchingEngineKey',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'mePubKey',
        type: 'address'
      }
    ],
    name: 'OnRemovedMatchingEngineKey',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'previousOwner',
        type: 'address'
      }
    ],
    name: 'OwnershipRenounced',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'previousOwner',
        type: 'address'
      },
      {
        indexed: true,
        name: 'newOwner',
        type: 'address'
      }
    ],
    name: 'OwnershipTransferred',
    type: 'event'
  },
  {
    constant: false,
    inputs: [
      {
        name: 'addr',
        type: 'address'
      },
      {
        name: 'assetIds',
        type: 'uint16[]'
      }
    ],
    name: 'getBalances',
    outputs: [
      {
        name: '',
        type: 'uint64[]'
      }
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'getTradingBalances',
    outputs: [
      {
        name: '',
        type: 'uint64[]'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'getContractBalances',
    outputs: [
      {
        name: '',
        type: 'uint64[]'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [
      {
        name: 'addr',
        type: 'address'
      },
      {
        name: 'wlType',
        type: 'uint8'
      }
    ],
    name: 'getWhitelistStatus',
    outputs: [
      {
        name: '',
        type: 'bool'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: 'addr',
        type: 'address'
      }
    ],
    name: 'initiateManualWithdrawal',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: 'addr',
        type: 'address'
      },
      {
        name: 'assetId',
        type: 'uint16'
      }
    ],
    name: 'completeManualWithdrawal',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: 'stateUpdates',
        type: 'bytes'
      },
      {
        name: 'mePubKey',
        type: 'address'
      },
      {
        name: 'meSig',
        type: 'bytes'
      }
    ],
    name: 'syncStates',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: 'addr',
        type: 'address'
      },
      {
        name: 'assetId',
        type: 'uint16'
      },
      {
        name: 'amount',
        type: 'uint64'
      },
      {
        name: 'nonce',
        type: 'uint32'
      },
      {
        name: 'userPubKey',
        type: 'address'
      },
      {
        name: 'userSig',
        type: 'bytes'
      },
      {
        name: 'meSig',
        type: 'bytes'
      }
    ],
    name: 'deposit',
    outputs: [],
    payable: true,
    stateMutability: 'payable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: 'addr',
        type: 'address'
      },
      {
        name: 'assetId',
        type: 'uint16'
      },
      {
        name: 'amount',
        type: 'uint64'
      },
      {
        name: 'nonce',
        type: 'uint32'
      },
      {
        name: 'userPubKey',
        type: 'address'
      },
      {
        name: 'userSig',
        type: 'bytes'
      },
      {
        name: 'meSig',
        type: 'bytes'
      }
    ],
    name: 'sharedWithdrawal',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: 'addr',
        type: 'address'
      },
      {
        name: 'assetIds',
        type: 'uint16[2]'
      },
      {
        name: 'assetNonces',
        type: 'uint32[2]'
      },
      {
        name: 'amount',
        type: 'uint64'
      },
      {
        name: 'minMaxOrderRate',
        type: 'uint64[2]'
      },
      {
        name: 'maxFeeRate',
        type: 'uint64'
      },
      {
        name: 'nonce',
        type: 'uint32'
      },
      {
        name: 'mePubKey',
        type: 'address'
      },
      {
        name: 'userSig',
        type: 'bytes'
      },
      {
        name: 'meSig',
        type: 'bytes'
      },
      {
        name: 'actualAmount',
        type: 'uint64'
      },
      {
        name: 'actualOrderRate',
        type: 'uint64'
      },
      {
        name: 'actualFeeRate',
        type: 'uint64'
      }
    ],
    name: 'fillOrder',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: 'asset',
        type: 'address'
      },
      {
        name: 'numDecimals',
        type: 'uint8'
      }
    ],
    name: 'addSupportedAsset',
    outputs: [
      {
        name: '',
        type: 'uint16'
      }
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: 'addr',
        type: 'address'
      }
    ],
    name: 'addWhitelistAdmin',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: 'addr',
        type: 'address'
      }
    ],
    name: 'removeWhitelistAdmin',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: 'mePubKey',
        type: 'address'
      }
    ],
    name: 'addMatchingEngineKey',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: 'mePubKey',
        type: 'address'
      }
    ],
    name: 'removeMatchingEngineKey',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: 'withdrawalTime',
        type: 'uint16'
      }
    ],
    name: 'setWithdrawalTimeout',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  }
]
