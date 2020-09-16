export enum Networks {
  MainNet = 'https://explorer.neo.nash.io/api/main_net',
  TestNet = 'TestNet',
  // TODO: Needs to be just NexNet - there is a bug in nex-wrapper
  NexNet = 'https://nex.neoscan-testnet.io/api/test_net',
  LocalNet = 'http://127.0.0.1:7000/api/main_net',
  Staging = 'https://neo-local-explorer.staging.nash.io/api/main_net',
  Master = 'https://neo-local-explorer.master.nash.io/api/main_net',
  Sandbox = 'https://explorer.neo.sandbox.nash.io/api/main_net',
  Dev1 = 'https://neo-local-explorer.dev1.nash.io/api/main_net',
  Dev2 = 'https://neo-local-explorer.dev2.nash.io/api/main_net',
  Dev3 = 'https://neo-local-explorer.dev3.nash.io/api/main_net',
  Dev4 = 'https://neo-local-explorer.dev4.nash.io/api/main_net',
  QA1 = 'https://neo-local-explorer.qa1.nash.io/api/main_net'
}

export interface NetworkSettings {
  contracts?: {
    staking?: {
      contract?: string
      address?: string
    }
    vault?: {
      contract?: string
      address?: string
    }
    nexToken?: string
  }
  nodes: string[]
  name?: string
}

// TODO add bitcoin network settings

type NetworkSettingsRecord = Record<Networks, NetworkSettings>

const LOCAL_ETH_CONTRACTS: NetworkSettings['contracts'] = {
  vault: {
    contract: '0x396FDAd6b7C6BaC97B6A22499F6748FD1d36546F'
  }
}

export const ETH_NETWORK: NetworkSettingsRecord = {
  [Networks.MainNet]: {
    contracts: {
      vault: {
        contract: '0x00F2B67B5A5EC2FF88B2BE7D5A8D1A39D5929237'
      }
    },
    nodes: ['https://consensus1.eth.nash.io','https://consensus2.eth.nash.io','https://consensus3.eth.nash.io']
  },
  [Networks.TestNet]: {
    contracts: {},
    nodes: ['http://rinkeby.infura.io/v3/e1b716940a374ec79271402b9a79d1e4']
  },
  [Networks.NexNet]: {
    contracts: {
      vault: {
        contract: '0xfd6936bead7c8790413Ca93b5Df02c651eF36124'
      }
    },
    nodes: [
      'http://35.245.154.230:8545',
      'http://35.246.228.42:8545',
      'http://35.197.94.238:8545'
    ]
  },
  [Networks.LocalNet]: {
    contracts: LOCAL_ETH_CONTRACTS,
    nodes: ['http://127.0.0.1:8545']
  },
  [Networks.Staging]: {
    contracts: LOCAL_ETH_CONTRACTS,
    nodes: ['https://eth-local-consensus.staging.nash.io']
  },
  [Networks.Master]: {
    contracts: LOCAL_ETH_CONTRACTS,
    nodes: ['https://eth-local-consensus.master.nash.io']
  },
  [Networks.Sandbox]: {
    contracts: LOCAL_ETH_CONTRACTS,
    nodes: ['https://consensus.eth.sandbox.nash.io']
  },
  [Networks.Dev1]: {
    contracts: LOCAL_ETH_CONTRACTS,
    nodes: ['https://eth-local-consensus.dev1.nash.io']
  },
  [Networks.Dev2]: {
    contracts: LOCAL_ETH_CONTRACTS,
    nodes: ['https://eth-local-consensus.dev2.nash.io']
  },
  [Networks.Dev3]: {
    contracts: LOCAL_ETH_CONTRACTS,
    nodes: ['https://eth-local-consensus.dev3.nash.io']
  },
  [Networks.Dev4]: {
    contracts: LOCAL_ETH_CONTRACTS,
    nodes: ['https://eth-local-consensus.dev4.nash.io']
  },
  [Networks.QA1]: {
    contracts: LOCAL_ETH_CONTRACTS,
    nodes: ['https://eth-local-consensus.qa1.nash.io']
  }
}

// Contracts for all environments except mainnet, testnet, and nexnet
const LOCAL_NEO_CONTRACTS: NetworkSettings['contracts'] = {
  staking: {
    contract: 'f65cfc6122c34b4201f4557ce8c2f15d4672ce67',
    address: 'AREkZQLmY3gS448gngCyvghTxYcYEf61ri'
  },
  vault: {
    contract: 'D9B2A9EF4982A96DDCC2C44D463AA688615F16EB',
    address: 'AdCuF41cwxL9LMMRoq5Tyu7P2YHJeph8Dj'
  },
  nexToken: '7991cdc8103a0eb8d3a68d6411d4b0c80d38d912'
}

export const NEO_NETWORK: NetworkSettingsRecord = {
  [Networks.MainNet]: {
    contracts: {
      staking: {
        contract: '50491c82d9a8c3d4a02b03134f9c8e2089ad4c38',
        address: 'ALuZLuuDssJqG2E4foANKwbLamYHuffFjg'
      },
      vault: {
        contract: 'E48DDE213EE6E51CBC0A888339B335DC6122D401',
        address: 'AFwYT3HDAwkTneE8JytrCG1MWAFaqBUmnr'
      },
      nexToken: '3a4acd3647086e7c44398aac0349802e6a171129'
    },
    nodes: [
      'https://m1.neo.nash.io:443',
      'https://m2.neo.nash.io:443',
      'https://m3.neo.nash.io:443',
      'https://m4.neo.nash.io:443',
      'https://m5.neo.nash.io:443'
    ]
  },
  [Networks.TestNet]: {
    contracts: {},
    nodes: [
      'https://t1.neo.nash.io:443',
      'https://t2.neo.nash.io:443',
      'http://seed1.ngd.network:20332',
      'http://seed2.ngd.network:20332',
      'http://seed3.ngd.network:20332'
    ]
  },
  [Networks.NexNet]: {
    contracts: {
      staking: {
        contract: '89df5b8ab3791626753b692e69c374a345f2e260',
        address: 'AQcAPRai7N8Sjw24w71VLM28GBW4DAXp2D'
      },
      vault: {
        contract: 'c20f1712e4f2aa4ceee8538ddd53751d7196e4cb',
        address: 'AaMxezKvutUMHXXDNmY2az8ePnTsvQgJsg'
      },
      nexToken: 'ae1046975d425243ce1b1d487c052c94075e205b'
    },
    nodes: [
      'http://5.35.241.70:10001',
      'http://5.35.241.70:10002',
      'http://5.35.241.70:10003'
    ]
  },
  [Networks.LocalNet]: {
    contracts: LOCAL_NEO_CONTRACTS,
    nodes: [
      'http://127.0.0.1:30333',
      'http://127.0.0.1:30334',
      'http://127.0.0.1:30335'
    ]
  },
  [Networks.Staging]: {
    contracts: LOCAL_NEO_CONTRACTS,
    nodes: [
      'https://neo-local-consensus.staging.nash.io/node1',
      'https://neo-local-consensus.staging.nash.io/node2',
      'https://neo-local-consensus.staging.nash.io/node3'
    ]
  },
  [Networks.Master]: {
    contracts: LOCAL_NEO_CONTRACTS,
    nodes: [
      'https://neo-local-consensus.master.nash.io/node1',
      'https://neo-local-consensus.master.nash.io/node2',
      'https://neo-local-consensus.master.nash.io/node3'
    ]
  },
  [Networks.Sandbox]: {
    contracts: LOCAL_NEO_CONTRACTS,
    nodes: [
      'https://consensus.neo.sandbox.nash.io/node1',
      'https://consensus.neo.sandbox.nash.io/node2',
      'https://consensus.neo.sandbox.nash.io/node3'
    ]
  },
  [Networks.Dev1]: {
    contracts: LOCAL_NEO_CONTRACTS,
    nodes: [
      'https://neo-local-consensus.dev1.nash.io/node1',
      'https://neo-local-consensus.dev1.nash.io/node2',
      'https://neo-local-consensus.dev1.nash.io/node3'
    ]
  },
  [Networks.Dev2]: {
    contracts: LOCAL_NEO_CONTRACTS,
    nodes: [
      'https://neo-local-consensus.dev2.nash.io/node1',
      'https://neo-local-consensus.dev2.nash.io/node2',
      'https://neo-local-consensus.dev2.nash.io/node3'
    ]
  },
  [Networks.Dev3]: {
    contracts: LOCAL_NEO_CONTRACTS,
    nodes: [
      'https://neo-local-consensus.dev3.nash.io/node1',
      'https://neo-local-consensus.dev3.nash.io/node2',
      'https://neo-local-consensus.dev3.nash.io/node3'
    ]
  },
  [Networks.Dev4]: {
    contracts: LOCAL_NEO_CONTRACTS,
    nodes: [
      'https://neo-local-consensus.dev4.nash.io/node1',
      'https://neo-local-consensus.dev4.nash.io/node2',
      'https://neo-local-consensus.dev4.nash.io/node3'
    ]
  },
  [Networks.QA1]: {
    contracts: LOCAL_NEO_CONTRACTS,
    nodes: [
      'https://neo-local-consensus.qa1.nash.io/node1',
      'https://neo-local-consensus.qa1.nash.io/node2',
      'https://neo-local-consensus.qa1.nash.io/node3'
    ]
  }
}

export const BTC_NETWORK: NetworkSettingsRecord = {
  [Networks.MainNet]: {
    nodes: ['https://btc-mainnet-explorer.nash.io'],
    name: 'MainNet'
  },
  [Networks.TestNet]: {
    nodes: ['https://btc-testnet-explorer.nash.io'],
    name: 'TestNet'
  },
  [Networks.NexNet]: {
    nodes: ['https://btc-local-explorer.nexnet.nash.io'],
    name: 'TestNet'
  },
  [Networks.LocalNet]: {
    nodes: ['https://btc-local-explorer.nash.io'],
    name: 'TestNet'
  },
  [Networks.Staging]: {
    nodes: ['https://btc-local-explorer.staging.nash.io'],
    name: 'TestNet'
  },
  [Networks.Master]: {
    nodes: ['https://btc-local-explorer.master.nash.io'],
    name: 'TestNet'
  },
  [Networks.Sandbox]: {
    nodes: ['https://btc-local-explorer.sandbox.nash.io'],
    name: 'TestNet'
  },
  [Networks.Dev1]: {
    nodes: ['/btc-explorer-dev1'],
    name: 'TestNet'
  },
  [Networks.Dev2]: {
    nodes: ['/btc-explorer-dev2'],
    name: 'TestNet'
  },
  [Networks.Dev3]: {
    nodes: ['/btc-explorer-dev3'],
    name: 'TestNet'
  },
  [Networks.Dev4]: {
    nodes: ['/btc-explorer-dev4'],
    name: 'TestNet'
  },
  [Networks.QA1]: {
    nodes: ['/btc-explorer-qa1'],
    name: 'TestNet'
  }
}
