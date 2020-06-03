import { NEO_NETWORK, BTC_NETWORK, Networks, ETH_NETWORK } from './networks'

export interface EnvironmentConfig {
  host: string
  maxEthCostPrTransaction?: string
  debug?: boolean
  neoScan?: string
  neoNetworkSettings?: typeof NEO_NETWORK[Networks.MainNet]
  ethNetworkSettings?: typeof ETH_NETWORK[Networks.MainNet]
  btcNetworkSettings?: typeof BTC_NETWORK[Networks.MainNet]
  isLocal: boolean
}

export interface ClientOptions {
  runRequestsOverWebsockets?: boolean
  enablePerformanceTelemetry?: boolean
  performanceTelemetryTag?: string

  // Http headers to send with each request.
  // The socketsocket conneciton supports 1 header. "User-Agent"
  // while the others support all, but you cannot override content-type nor the authorization token
  headers?: Record<string, string>
}
export const EnvironmentConfiguration = {
  production: {
    host: 'app.nash.io',
    neoScan: 'https://neoscan.io/api/main_net',
    ethNetworkSettings: ETH_NETWORK[Networks.MainNet],
    neoNetworkSettings: NEO_NETWORK[Networks.MainNet],
    btcNetworkSettings: BTC_NETWORK[Networks.MainNet],
    isLocal: false
  } as EnvironmentConfig,
  sandbox: {
    host: 'app.sandbox.nash.io',
    neoScan: 'https://explorer.neo.sandbox.nash.io/api/main_net',
    ethNetworkSettings: ETH_NETWORK[Networks.Sandbox],
    neoNetworkSettings: NEO_NETWORK[Networks.Sandbox],
    btcNetworkSettings: BTC_NETWORK[Networks.Sandbox],
    isLocal: false
  } as EnvironmentConfig,
  master: {
    host: 'app.master.nash.io',
    neoScan: 'https://neo-local-explorer.master.nash.io/api/main_net',
    ethNetworkSettings: ETH_NETWORK[Networks.Master],
    neoNetworkSettings: NEO_NETWORK[Networks.Master],
    btcNetworkSettings: BTC_NETWORK[Networks.Master],
    isLocal: false
  } as EnvironmentConfig,
  staging: {
    host: 'app.staging.nash.io',
    neoScan: 'https://neo-local-explorer.staging.nash.io/api/main_net',
    ethNetworkSettings: ETH_NETWORK[Networks.Staging],
    neoNetworkSettings: NEO_NETWORK[Networks.Staging],
    btcNetworkSettings: BTC_NETWORK[Networks.Staging],
    isLocal: false
  } as EnvironmentConfig,
  dev1: {
    host: 'app.dev1.nash.io',
    neoScan: 'https://neo-local-explorer.dev1.nash.io/api/main_net',
    ethNetworkSettings: ETH_NETWORK[Networks.Dev1],
    neoNetworkSettings: NEO_NETWORK[Networks.Dev1],
    btcNetworkSettings: BTC_NETWORK[Networks.Dev1],
    isLocal: false
  } as EnvironmentConfig,
  dev2: {
    host: 'app.dev2.nash.io',
    neoScan: 'https://neo-local-explorer.dev2.nash.io/api/main_net',
    ethNetworkSettings: ETH_NETWORK[Networks.Dev2],
    neoNetworkSettings: NEO_NETWORK[Networks.Dev2],
    btcNetworkSettings: BTC_NETWORK[Networks.Dev2],
    isLocal: false
  } as EnvironmentConfig,
  dev3: {
    host: 'app.dev3.nash.io',
    neoScan: 'https://neo-local-explorer.dev3.nash.io/api/main_net',
    ethNetworkSettings: ETH_NETWORK[Networks.Dev3],
    neoNetworkSettings: NEO_NETWORK[Networks.Dev3],
    btcNetworkSettings: BTC_NETWORK[Networks.Dev3],
    isLocal: false
  } as EnvironmentConfig,
  dev4: {
    host: 'app.dev4.nash.io',
    neoScan: 'https://neo-local-explorer.dev4.nash.io/api/main_net',
    ethNetworkSettings: ETH_NETWORK[Networks.Dev4],
    neoNetworkSettings: NEO_NETWORK[Networks.Dev4],
    btcNetworkSettings: BTC_NETWORK[Networks.Dev4],
    isLocal: false
  } as EnvironmentConfig,
  local: {
    host: 'localhost:4000',
    neoScan: 'http://localhost:7000/api/test_net',
    ethNetworkSettings: ETH_NETWORK[Networks.LocalNet],
    neoNetworkSettings: NEO_NETWORK[Networks.LocalNet],
    btcNetworkSettings: BTC_NETWORK[Networks.LocalNet],
    isLocal: true
  } as EnvironmentConfig,
  localDocker: {
    host: 'host.docker.internal:4000',
    neoScan: 'http://host.docker.internal:7000/api/test_net',
    ethNetworkSettings: ETH_NETWORK[Networks.LocalNet],
    neoNetworkSettings: NEO_NETWORK[Networks.LocalNet],
    btcNetworkSettings: BTC_NETWORK[Networks.LocalNet],
    isLocal: true
  } as EnvironmentConfig,
  internal: {
    host: 'cas',
    neoScan: 'http://chain-local-neo/api/main_net',
    ethNetworkSettings: ETH_NETWORK[Networks.LocalNet],
    neoNetworkSettings: NEO_NETWORK[Networks.LocalNet],
    btcNetworkSettings: BTC_NETWORK[Networks.LocalNet],
    isLocal: true
  }
}
