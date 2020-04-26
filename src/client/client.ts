import * as AbsintheSocket from '@absinthe/socket'
import { Socket as PhoenixSocket } from 'phoenix-channels'
import { print } from 'graphql/language/printer'
import setCookie from 'set-cookie-parser'
import fetch from 'node-fetch'
import toHex from 'array-buffer-to-hex'
import https from 'https'
import * as NeonJS from '@cityofzion/neon-js'
import * as bitcoin from 'bitcoinjs-lib'
import coinSelect from 'coinselect'
import { u, tx, sc, wallet } from '@cityofzion/neon-core'
import { TransactionReceipt } from 'web3-core'
import { Transaction as EthTransaction } from 'ethereumjs-tx'
import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'
import BigNumber from 'bignumber.js'
import { ApolloError } from './ApolloError'
import { LIST_MARKETS_QUERY } from '../queries/market/listMarkets'
import { GET_MARKET_QUERY } from '../queries/market/getMarket'
import { LIST_ACCOUNT_TRANSACTIONS } from '../queries/account/listAccountTransactions'
import {
  LIST_ACCOUNT_ORDERS,
  LIST_ACCOUNT_ORDERS_WITH_TRADES
} from '../queries/order/listAccountOrders'
import { LIST_ACCOUNT_TRADES } from '../queries/trade/listAccountTrades'
import {
  GET_ACCOUNT_ADDRESS,
  GetAccountAddressParams,
  GetAccountAddressResult
} from '../queries/account/getAccountAddress'
import { LIST_ACCOUNT_BALANCES } from '../queries/account/listAccountBalances'
import { LIST_MOVEMENTS } from '../queries/movement/listMovements'
import { GET_ACCOUNT_BALANCE } from '../queries/account/getAccountBalance'
import { GET_ACCOUNT_ORDER } from '../queries/order/getAccountOrder'
import { GET_MOVEMENT } from '../queries/movement/getMovement'
import { GET_TICKER } from '../queries/market/getTicker'
import { CANCEL_ORDER_MUTATION } from '../mutations/orders/cancelOrder'
import { CANCEL_ALL_ORDERS_MUTATION } from '../mutations/orders/cancelAllOrders'

import {
  USER_2FA_LOGIN_MUTATION,
  TwoFactorLoginResponse
} from '../mutations/account/twoFactorLoginMutation'

import { LIST_CANDLES } from '../queries/candlestick/listCandles'
import { LIST_TICKERS } from '../queries/market/listTickers'
import { LIST_TRADES } from '../queries/market/listTrades'
import { GET_ORDERBOOK } from '../queries/market/getOrderBook'
import { PLACE_LIMIT_ORDER_MUTATION } from '../mutations/orders/placeLimitOrder'
import { PLACE_MARKET_ORDER_MUTATION } from '../mutations/orders/placeMarketOrder'
import { PLACE_STOP_LIMIT_ORDER_MUTATION } from '../mutations/orders/placeStopLimitOrder'
import { PLACE_STOP_MARKET_ORDER_MUTATION } from '../mutations/orders/placeStopMarketOrder'
import { ADD_MOVEMENT_MUTATION } from '../mutations/movements/addMovementMutation'
import {
  PREPARE_MOVEMENT_MUTATION,
  PrepareMovementData,
  PrepareMovementVariables
} from '../mutations/movements/prepareMovement'
import { AddMovement } from '../mutations/movements/fragments/addMovementFragment'
import { GET_ACCOUNT_PORTFOLIO } from '../queries/account/getAccountPortfolio'
import { LIST_ASSETS_QUERY } from '../queries/asset/listAsset'

import { NEW_ACCOUNT_TRADES } from '../subscriptions/newAccountTrades'
import { UPDATED_ACCOUNT_ORDERS } from '../subscriptions/updatedAccountOrders'
import { UPDATED_ORDER_BOOK } from '../subscriptions/updatedOrderBook'
import { NEW_TRADES } from '../subscriptions/newTrades'
import { UPDATED_TICKERS } from '../subscriptions/updatedTickers'
import { UPDATED_CANDLES } from '../subscriptions/updatedCandles'

import {
  DH_FIIL_POOL,
  DHFillPoolArgs,
  DHFillPoolResp
} from '../mutations/dhFillPool'
import {
  GetAssetsNoncesData,
  GET_ASSETS_NONCES_QUERY,
  AssetsNoncesData
} from '../queries/nonces'
import {
  GET_ORDERS_FOR_MOVEMENT_QUERY,
  OrdersForMovementData
} from '../queries/movement/getOrdersForMovementQuery'

import { checkMandatoryParams, detectBlockchain } from './utils'

import {
  GetStatesData,
  SyncStatesData,
  SignStatesData,
  SIGN_STATES_MUTATION,
  SYNC_STATES_MUTATION
} from '../mutations/stateSyncing'

import {
  CompletePayloadSignatureType,
  COMPLETE_PAYLOAD_SIGNATURE,
  CompletePayloadSignatureArgs,
  CompletePayloadSignatureResult
} from '../mutations/mpc/completeSignature'

import {
  COMPLETE_BTC_TRANSACTION_SIGNATURES,
  CompleteBtcTransactionSignaturesArgs,
  CompleteBtcTransactionSignaturesResult
} from '../mutations/mpc/completeBTCTransacitonSignatures'

import {
  SEND_BLOCKCHAIN_RAW_TRANSACTION,
  SendBlockchainRawTransactionArgs,
  SendBlockchainRawTransactionResult
} from '../mutations/blockchain/sendBlockchainRawTransaction'

import { FiatCurrency } from '../constants/currency'
import {
  normalizePriceForMarket,
  mapMarketsForNashProtocol,
  normalizeAmountForMarket
} from '../helpers'
import {
  OrderBook,
  TradeHistory,
  Ticker,
  Trade,
  CandleRange,
  CandleInterval,
  Movement,
  MovementStatus,
  MovementType,
  AccountPortfolio,
  Period,
  CancelledOrder,
  AccountBalance,
  AccountTransaction,
  OrderPlaced,
  Market,
  Order,
  DateTime,
  AccountOrder,
  OrderBuyOrSell,
  OrderCancellationPolicy,
  CurrencyAmount,
  CurrencyPrice,
  PaginationCursor,
  OrderStatus,
  OrderType,
  SignMovementResult,
  Blockchain as TSAPIBlockchain,
  AssetData,
  Asset,
  MissingNonceError,
  InsufficientFundsError
} from '../types'

import { CryptoCurrency } from '../constants/currency'

import {
  APIKey,
  BIP44,
  Blockchain,
  bufferize,
  ChildKey,
  computePresig,
  Config,
  createAddMovementParams,
  createCancelOrderParams,
  createGetAssetsNoncesParams,
  createGetMovementParams,
  createGetOrdersForMovementParams,
  createListMovementsParams,
  createPlaceLimitOrderParams,
  createPlaceMarketOrderParams,
  createPlaceStopLimitOrderParams,
  createPlaceStopMarketOrderParams,
  createSendBlockchainRawTransactionParams,
  createSignStatesParams,
  createSyncStatesParams,
  createTimestamp,
  encryptSecretKey,
  getHKDFKeysFromPassword,
  getSecretKey,
  initialize,
  InitParams,
  MovementTypeDeposit,
  MovementTypeWithdrawal,
  PayloadAndKind,
  preSignPayload,
  SigningPayloadID,
  signPayload,
  SyncState
} from '@neon-exchange/nash-protocol'

import {
  States,
  SignStatesFields
} from 'mutations/stateSyncing/fragments/signStatesFragment'

import { NEO_NETWORK, BTC_NETWORK, Networks, ETH_NETWORK } from './networks'

import {
  prefixWith0xIfNeeded,
  setSignature,
  transferExternalGetAmount,
  serializeEthTx
} from './ethUtils'

import { SettlementABI } from './abi/eth/settlementABI'
import { Erc20ABI } from './abi/eth/erc20ABI'

import {
  calculateBtcFees,
  BTC_SATOSHI_MULTIPLIER,
  networkFromName,
  calculateFeeRate,
  getHashAndSighashType
} from './btcUtils'

export interface EnvironmentConfig {
  host: string
  maxEthCostPrTransaction?: string
  debug?: boolean
  neoScan?: string
  neoNetworkSettings?: typeof NEO_NETWORK[Networks.MainNet]
  ethNetworkSettings?: typeof ETH_NETWORK[Networks.MainNet]
  btcNetworkSettings?: typeof BTC_NETWORK[Networks.MainNet]
}

export interface ClientOptions {
  runRequestsOverWebsockets?: boolean
}
export const EnvironmentConfiguration = {
  production: {
    host: 'app.nash.io',
    neoScan: 'https://neoscan.io/api/main_net',
    ethNetworkSettings: ETH_NETWORK[Networks.MainNet],
    neoNetworkSettings: NEO_NETWORK[Networks.MainNet],
    btcNetworkSettings: BTC_NETWORK[Networks.MainNet]
  } as EnvironmentConfig,
  sandbox: {
    host: 'app.sandbox.nash.io',
    neoScan: 'https://explorer.neo.sandbox.nash.io/api/main_net',
    ethNetworkSettings: ETH_NETWORK[Networks.Sandbox],
    neoNetworkSettings: NEO_NETWORK[Networks.Sandbox],
    btcNetworkSettings: BTC_NETWORK[Networks.Sandbox]
  } as EnvironmentConfig,
  master: {
    host: 'app.master.nash.io',
    neoScan: 'https://neo-local-explorer.master.nash.io/api/main_net',
    ethNetworkSettings: ETH_NETWORK[Networks.Master],
    neoNetworkSettings: NEO_NETWORK[Networks.Master],
    btcNetworkSettings: BTC_NETWORK[Networks.Master]
  } as EnvironmentConfig,
  staging: {
    host: 'app.staging.nash.io',
    neoScan: 'https://neo-local-explorer.staging.nash.io/api/main_net',
    ethNetworkSettings: ETH_NETWORK[Networks.Staging],
    neoNetworkSettings: NEO_NETWORK[Networks.Staging],
    btcNetworkSettings: BTC_NETWORK[Networks.Staging]
  } as EnvironmentConfig,
  dev1: {
    host: 'app.dev1.nash.io',
    neoScan: 'https://neo-local-explorer.dev1.nash.io/api/main_net',
    ethNetworkSettings: ETH_NETWORK[Networks.Dev1],
    neoNetworkSettings: NEO_NETWORK[Networks.Dev1],
    btcNetworkSettings: BTC_NETWORK[Networks.Dev1]
  } as EnvironmentConfig,
  dev2: {
    host: 'app.dev2.nash.io',
    neoScan: 'https://neo-local-explorer.dev2.nash.io/api/main_net',
    ethNetworkSettings: ETH_NETWORK[Networks.Dev2],
    neoNetworkSettings: NEO_NETWORK[Networks.Dev2],
    btcNetworkSettings: BTC_NETWORK[Networks.Dev2]
  } as EnvironmentConfig,
  dev3: {
    host: 'app.dev3.nash.io',
    neoScan: 'https://neo-local-explorer.dev3.nash.io/api/main_net',
    ethNetworkSettings: ETH_NETWORK[Networks.Dev3],
    neoNetworkSettings: NEO_NETWORK[Networks.Dev3],
    btcNetworkSettings: BTC_NETWORK[Networks.Dev3]
  } as EnvironmentConfig,
  dev4: {
    host: 'app.dev4.nash.io',
    neoScan: 'https://neo-local-explorer.dev4.nash.io/api/main_net',
    ethNetworkSettings: ETH_NETWORK[Networks.Dev4],
    neoNetworkSettings: NEO_NETWORK[Networks.Dev4],
    btcNetworkSettings: BTC_NETWORK[Networks.Dev4]
  } as EnvironmentConfig,
  local: { host: 'localhost:4000' } as EnvironmentConfig
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const BLOCKCHAIN_TO_BIP44 = {
  [Blockchain.ETH]: BIP44.ETH,
  [Blockchain.BTC]: BIP44.BTC,
  [Blockchain.NEO]: BIP44.NEO
}

const NEP5_OLD_ASSETS = ['nos', 'phx', 'guard', 'lx', 'ava']
export const sanitizeAddMovementPayload = (payload: {
  recycled_orders: []
  resigned_orders: []
  recycledOrders: []
  resignedOrders: []
  digests: []
  signed_transaction_elements: []
  signedTransactionElements: []
}) => {
  const submitPayload = { ...payload }
  if (
    payload.recycled_orders != null ||
    payload.resigned_orders != null ||
    payload.recycledOrders != null
  ) {
    delete submitPayload.recycled_orders
    delete submitPayload.recycledOrders
    submitPayload.resignedOrders = submitPayload.resigned_orders
    delete submitPayload.resigned_orders
  }
  if (payload.digests != null) {
    delete submitPayload.digests
  }
  if (payload.signed_transaction_elements != null) {
    submitPayload.signedTransactionElements =
      payload.signed_transaction_elements
    delete submitPayload.signed_transaction_elements
  }
  return submitPayload
}

export interface NonceSet {
  noncesFrom: number[]
  noncesTo: number[]
  nonceOrder: number
}

interface LoginParams {
  email: string
  password: string
  twoFaCode?: string
  walletIndices?: { [key: string]: number }
  presetWallets?: object
  salt?: string
}

interface ListAccountTradeParams {
  before?: PaginationCursor
  limit?: number
  marketName?: string
}

interface ListAccountTransactionsParams {
  cursor?: string
  fiatSymbol?: string
  limit?: number
}

interface GetAccountPortfolioParams {
  fiatSymbol?: FiatCurrency
  period?: Period
}

interface ListTradeParams {
  marketName: string
  limit?: number
  before?: PaginationCursor
}

interface ListCandlesParams {
  marketName: string
  before?: DateTime
  interval?: CandleInterval
  limit?: number
}

interface ListMovementsParams {
  currency?: CryptoCurrency
  status?: MovementStatus
  type?: MovementType
}

interface ListAccountOrderParams {
  before?: PaginationCursor
  buyOrSell?: OrderBuyOrSell
  limit?: number
  marketName?: string
  rangeStart?: DateTime
  rangeStop?: DateTime
  status?: [OrderStatus]
  type?: [OrderType]
  shouldIncludeTrades?: boolean
}

enum ClientMode {
  NONE = 'NONE',
  MPC = 'MPC',
  FULL_SECRET = 'FULL_SECRET'
}
/**
 * These interfaces are just here to
 */
interface GQLQueryParams<V> {
  query: any
  variables?: V
}
interface GQLMutationParams<V> {
  mutation: any
  variables?: V
}

interface GQLError {
  message: string
}

interface GQLResp<T> {
  data: T
  errors?: GQLError[]
}

interface GQL {
  query<T = any, V = any>(params: GQLQueryParams<V>): Promise<GQLResp<T>>
  mutate<T = any, V = any>(params: GQLMutationParams<V>): Promise<GQLResp<T>>
}

const previousPrintResults = new Map<any, string>()

// Print will instantiate a new visitor every time. Lets cache previously printed queries.
const memorizedPrint = (ast: any): string => {
  if (previousPrintResults.has(ast)) {
    return previousPrintResults.get(ast)
  }
  const str = print(ast) as string
  previousPrintResults.set(ast, str)
  return str
}

const P2shP2wpkhScript = (pubkeyBuffer: Buffer): Buffer => {
  // HASH160 len(20) {script} OP_EQUAL
  const addrHash = bitcoin.crypto.hash160(pubkeyBuffer)
  const script = 'a914' + addrHash.toString('hex') + '87'
  return Buffer.from(script, 'hex')
}

export const MISSING_NONCES = 'missing_asset_nonces'
export const MAX_SIGN_STATE_RECURSION = 5

interface SubscriptionHandlers<T> {
  onResult: (p: T) => void
  onError: (p: Error) => void
  onAbort: (p: Error) => void
  onStart: (p: object) => void
}

interface NashSocketEvents {
  /**
   * See https://www.npmjs.com/package/phoenix-channels
   */
  socket: InstanceType<PhoenixSocket>
  absintheSocket: InstanceType<AbsintheSocket>
  onUpdatedAccountOrders(
    variables: {
      buyOrSell?: OrderBuyOrSell
      marketName?: string
      rangeStart?: DateTime
      rangeStop?: DateTime
      status?: OrderStatus[]
      type?: OrderType[]
    },
    handlers: SubscriptionHandlers<{
      data: {
        updatedAccountOrders: Order[]
      }
    }>
  ): void
  onUpdatedCandles(
    variables: { interval: CandleInterval; marketName: string },
    handlers: SubscriptionHandlers<{
      data: {
        updatedCandles: CandleRange[]
      }
    }>
  ): void
  onUpdatedTickers(
    handlers: SubscriptionHandlers<{
      data: {
        updatedTickers: Ticker[]
      }
    }>
  ): void
  onNewTrades(
    variables: { marketName: string },
    handlers: SubscriptionHandlers<{
      data: {
        newTrades: Trade[]
      }
    }>
  ): void
  onUpdatedOrderbook(
    variables: { marketName: string },
    handlers: SubscriptionHandlers<{
      data: {
        updatedOrderBook: OrderBook
      }
    }>
  ): void
  onAccountTrade(
    variables: { marketName: string },
    handlers: SubscriptionHandlers<{
      data: {
        newAccountTrades: Trade[]
      }
    }>
  ): void
}

export const findBestNetworkNode = async (nodes): Promise<string> => {
  for (const url of nodes) {
    try {
      const s = await fetch(url)
      if (s.status >= 400) {
        throw new Error('invalid')
      }
      return url
    } catch (e) {
      console.info(url, 'is down. Trying next node')
    }
  }
  throw new Error('No neo nodes up')
}

export class Client {
  private connection: NashSocketEvents
  private mode: ClientMode = ClientMode.NONE
  public ethVaultContract: Contract
  public apiKey: APIKey
  private maxEthCostPrTransaction: BigNumber
  private opts: EnvironmentConfig
  private clientOpts: ClientOptions
  private apiUri: string
  private headers: object = {
    'Content-Type': 'application/json'
  }

  private initParams: InitParams
  private nashCoreConfig: Config
  private casCookie: string
  private publicKey: string
  private account: any

  private wsToken: string
  private casUri: string
  private wsUri: string
  private isMainNet: boolean
  private gql: GQL
  private web3: Web3
  private authorization: string
  public marketData: { [key: string]: Market }
  public nashProtocolMarketData: ReturnType<typeof mapMarketsForNashProtocol>
  private walletIndices: { [key: string]: number }
  public assetData: { [key: string]: AssetData }

  private tradedAssets: string[] = []
  private assetNonces: { [key: string]: number[] }
  private currentOrderNonce: number

  /**
   * Create a new instance of [[Client]]
   *
   * @param opts
   * @returns
   *
   * Example
   * ```
   * import { Client, EnvironmentConfiguration } from '@neon-exchange/api-client-typescript'
   *
   * const nash = new Client(EnvironmentConfiguration.sandbox)
   * ```
   */
  constructor(opts: EnvironmentConfig, clientOpts: ClientOptions = {}) {
    this.opts = {
      maxEthCostPrTransaction: '0.01',
      ...opts
    }
    this.clientOpts = {
      runRequestsOverWebsockets: false,
      ...clientOpts
    }
    this.isMainNet = this.opts.host === EnvironmentConfiguration.production.host
    this.web3 = new Web3(this.opts.ethNetworkSettings.nodes[0])

    if (!opts.host || opts.host.indexOf('.') === -1) {
      throw new Error(`Invalid API host '${opts.host}'`)
    }

    this.apiUri = `https://${opts.host}/api/graphql`
    this.casUri = `https://${opts.host}/api`
    this.wsUri = `wss://${opts.host}/api/socket`
    this.maxEthCostPrTransaction = new BigNumber(
      this.web3.utils.toWei(this.opts.maxEthCostPrTransaction)
    )
    if (
      this.opts.maxEthCostPrTransaction == null ||
      isNaN(parseFloat(this.opts.maxEthCostPrTransaction))
    ) {
      throw new Error(
        'maxEthCostPrTransaction is invalid ' +
          this.opts.maxEthCostPrTransaction
      )
    }
    const network = new NeonJS.rpc.Network({
      ...this.opts.neoNetworkSettings,
      name: this.opts.neoNetworkSettings.name
    })
    NeonJS.default.add.network(network, true)
    this.ethVaultContract = new this.web3.eth.Contract(
      SettlementABI,
      this.opts.ethNetworkSettings.contracts.vault.contract
    )

    if (this.clientOpts.runRequestsOverWebsockets) {
      this.connection = this.createSocketConnection()
    }
    const agent = new https.Agent({
      keepAlive: true
    })
    const query: GQL['query'] = async params => {
      let obj: GQLResp<any>

      if (this.clientOpts.runRequestsOverWebsockets) {
        obj = await new Promise((resolve, reject) =>
          AbsintheSocket.observe(
            this.connection.absintheSocket,
            AbsintheSocket.send(this.connection.absintheSocket, {
              operation: memorizedPrint(params.query),
              variables: params.variables
            }),
            {
              onResult: res => resolve(res),
              onAbort: errs => reject(errs),
              onError: errs => reject(errs)
            }
          )
        )
      } else {
        const resp = await fetch(this.apiUri, {
          method: 'POST',
          headers: this.headers,
          agent,
          body: JSON.stringify({
            query: memorizedPrint(params.query),
            variables: params.variables
          })
        })
        if (resp.status !== 200) {
          let msg = `API error. Status code: ${resp.status}`
          if (resp.data) {
            msg += ` / body: ${resp.data}`
          }
          throw new Error(msg)
        }
        obj = await resp.json()
        if (obj.errors) {
          throw new ApolloError({
            graphQLErrors: obj.errors
          })
        }
      }
      return obj
    }

    this.gql = {
      query,
      mutate: params =>
        query({
          query: params.mutation,
          variables: params.variables
        })
    }
  }
  public disconnect() {
    if (this.clientOpts.runRequestsOverWebsockets) {
      this.connection.socket.disconnect()
    } else {
      console.warn('Client is not in websocket mode, .disconnect() is a no-op')
    }
  }

  private requireMode(mode: ClientMode, msg: string): void {
    if (this.mode !== mode) {
      throw new Error(msg)
    }
  }
  private requireMPC(): void {
    this.requireMode(
      ClientMode.MPC,
      'This feature requires logging in using an API Key'
    )
  }
  private requireFull(): void {
    this.requireMode(
      ClientMode.FULL_SECRET,
      'This feature requires logging in using username / password'
    )
  }

  /**
   * Sets up a websocket and authenticates it using the current token.
   *
   * @returns
   *
   * Example
   * ```
   * import { Client, EnvironmentConfiguration } from '@neon-exchange/api-client-typescript'
   *
   * const nash = new Client(EnvironmentConfiguration.sandbox)
   * await nash.login(...)
   *
   * const connection = nash.createSocketConnection()
   *
   * // Getting the orderbook for the neo_eth marked
   * connection.onUpdatedOrderbook(
   *  { marketName: 'neo_eth' },
   *  {
   *    onResult: ({
   *      data: {
   *        updatedOrderBook: { bids, asks }
   *      }
   *    }) => {
   *      console.log(`updated bids ${bids.length}`)
   *      console.log(`updated asks ${asks.length}`)
   *    }
   *  }
   * )
   *
   * // Getting the user orderobok for all markets
   * connection.onUpdatedAccountOrders(
   *  {},
   *  {
   *    onResult: ({
   *      data: {
   *        updatedAccountOrders
   *      }
   *    }) => {
   *      console.log(`Updated orders: {updatedAccountOrders.length}`)
   *    }
   *  }
   * )
   *
   * ```
   */
  createSocketConnection(): NashSocketEvents {
    if (this.wsUri == null) {
      throw new Error('wsUri config parameter missing')
    }
    const authCheck = (sub: string) => {
      if (this.wsToken == null) {
        throw new Error(
          'To use ' +
            sub +
            ', you must login() before creating the socket connection'
        )
      }
    }
    const socket = new PhoenixSocket(this.wsUri, {
      decode: (rawPayload, callback) => {
        const { join_ref, ref, topic, event, payload } = JSON.parse(rawPayload)

        if (payload.status === 'error') {
          if (typeof payload.response !== 'string') {
            payload.response = JSON.stringify(payload.response)
          }
        }

        return callback({
          join_ref,
          ref,
          topic,
          event,
          payload
        })
      },
      params:
        this.wsToken != null
          ? {
              token: this.wsToken
            }
          : {}
    })

    const absintheSocket = AbsintheSocket.create(socket)

    // The disconnect event is implemented incorrectly
    // as it does not trigger the correct events.
    //
    // This implementation triggers the correct events
    socket.disconnect = (c, code, reason) => {
      if (!socket.conn) {
        if (c) {
          c()
        }
        return
      }
      // https://github.com/mcampa/phoenix-channels/blob/master/src/socket.js#L137
      socket.conn.onclose = event => {
        socket.log('transport', 'close', event)
        // https://github.com/mcampa/phoenix-channels/blob/master/src/constants.js#L14
        socket.channels.forEach(channel => channel.trigger('phx_close'))
        clearInterval(socket.heartbeatTimer)
        socket.stateChangeCallbacks.close.forEach(callback => callback(event))
      }
      if (code) {
        socket.conn.close(code, reason || '')
      } else {
        socket.conn.close()
      }
      socket.conn = null
      if (c) {
        c()
      }
    }

    return {
      socket,
      absintheSocket,
      onUpdatedAccountOrders: async (payload, handlers) => {
        authCheck('onUpdatedAccountOrders')
        AbsintheSocket.observe(
          absintheSocket,
          AbsintheSocket.send(absintheSocket, {
            operation: memorizedPrint(UPDATED_ACCOUNT_ORDERS),
            variables: {
              payload
            }
          }),
          handlers
        )
      },
      onUpdatedCandles: (variables, handlers) =>
        AbsintheSocket.observe(
          absintheSocket,
          AbsintheSocket.send(absintheSocket, {
            operation: memorizedPrint(UPDATED_CANDLES),
            variables
          }),
          handlers
        ),
      onUpdatedTickers: handlers => {
        AbsintheSocket.observe(
          absintheSocket,
          AbsintheSocket.send(absintheSocket, {
            operation: memorizedPrint(UPDATED_TICKERS),
            variables: {}
          }),
          handlers
        )
      },
      onNewTrades: (variables, handlers) => {
        AbsintheSocket.observe(
          absintheSocket,
          AbsintheSocket.send(absintheSocket, {
            operation: memorizedPrint(NEW_TRADES),
            variables
          }),
          handlers
        )
      },
      onUpdatedOrderbook: (variables, handlers) => {
        AbsintheSocket.observe(
          absintheSocket,
          AbsintheSocket.send(absintheSocket, {
            operation: memorizedPrint(UPDATED_ORDER_BOOK),
            variables
          }),
          handlers
        )
      },
      onAccountTrade: async (payload, handlers) => {
        authCheck('onAccountTrade')
        AbsintheSocket.observe(
          absintheSocket,
          AbsintheSocket.send(absintheSocket, {
            operation: memorizedPrint(NEW_ACCOUNT_TRADES),
            variables: {
              payload
            }
          }),
          handlers
        )
      }
    }
  }

  /**
   * Login using an API key.
   *
   * request.
   * @returns
   * @param secret string
   * @param apiKey string
   * @returns
   *
   * Example
   * ```
   * try {
   *   nash.login(require('PATH_TO_KEY.json'))
   * } catch (e) {
   *   console.error(`login failed ${e}`)
   * }
   * ```
   */
  public async login({
    secret,
    apiKey
  }: {
    apiKey: string
    secret: string
  }): Promise<void> {
    this.mode = ClientMode.MPC
    this.authorization = `Token ${apiKey}`
    this.wsToken = apiKey
    if (this.clientOpts.runRequestsOverWebsockets) {
      this.connection.socket.disconnect()
      this.connection = this.createSocketConnection()
    }
    this.apiKey = JSON.parse(Buffer.from(secret, 'base64').toString('utf-8'))
    this.headers = {
      'Content-Type': 'application/json',
      Authorization: this.authorization
    }
    this.marketData = await this.fetchMarketData()
    this.nashProtocolMarketData = mapMarketsForNashProtocol(this.marketData)
    this.assetData = await this.fetchAssetData()

    this.currentOrderNonce = this.createTimestamp32()
    await this.updateTradedAssetNonces()
  }

  /**
   * Legacy login against the central account service. Note: you should prefer to use an API key with the `login` method.
   *
   * Be careful about using this feature, private keys are derived using the password.
   * So this technically gives full access to the account. Because of this the following features are not supported using the login.
   *
   *  - transferToExternal
   *  - depositToTradingContract
   *  - withdrawFromTradingContract
   *
   * @param email string
   * @param password string
   * @param twoFaCode string
   * @returns
   *
   * Example
   * ```
   * try {
   *   nash.legacyLogin({
   *     email: "email@domain.com",
   *     password: "example"
   *   })
   * } catch (e) {
   *   console.error(`login failed ${e}`)
   * }
   * ```
   */
  public async legacyLogin({
    email,
    password,
    twoFaCode,
    walletIndices = { neo: 1, eth: 1, btc: 1 },
    presetWallets,
    salt = ''
  }: LoginParams): Promise<void> {
    this.walletIndices = walletIndices
    const keys = await getHKDFKeysFromPassword(password, salt)
    const loginUrl = this.casUri + '/user_login'
    const body = {
      email,
      password: keys.authKey.toString('hex')
    }

    const response = await fetch(loginUrl, {
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST'
    })

    if (response.status !== 200) {
      let msg = `Login error. API status code: ${response.status}`
      if (response.data) {
        msg += ` / body: ${response.data}`
      }
      throw new Error(msg)
    }
    this.mode = ClientMode.FULL_SECRET

    const cookies = setCookie.parse(
      setCookie.splitCookiesString(response.headers.get('set-cookie'))
    )
    const cookie = cookies.find(c => c.name === 'nash-cookie')
    this.casCookie = cookie.name + '=' + cookie.value
    this.headers = {
      'Content-Type': 'application/json',
      Cookie: this.casCookie
    }
    const m = /nash-cookie=([0-9a-z-]+)/.exec(this.casCookie)
    if (m != null) {
      this.wsToken = m[1]
      if (this.clientOpts.runRequestsOverWebsockets) {
        this.connection.socket.disconnect()
        this.connection = this.createSocketConnection()
      }
    }
    const result = await response.json()
    if (result.error) {
      throw new Error(result.message)
    }

    this.account = result.account
    this.marketData = await this.fetchMarketData()
    this.assetData = await this.fetchAssetData()
    this.assetNonces = {}
    this.currentOrderNonce = this.createTimestamp32()

    if (result.message === 'Two factor required') {
      if (twoFaCode !== undefined) {
        this.account = await this.doTwoFactorLogin(twoFaCode)
        if (this.account.type === 'error') {
          throw new Error('Could not login')
        }
      } else {
        // 2FA code is undefined. Check if needed by backend
        throw new Error(
          'Login requires 2 factor code, but no twoFaCode argument supplied'
        )
      }
    }

    if (this.account.encrypted_secret_key === null) {
      console.log(
        'keys not present in the CAS: creating and uploading as we speak.'
      )

      await this.createAndUploadKeys(
        keys.encryptionKey,
        this.casCookie,
        presetWallets
      )
    }

    const aead = {
      encryptedSecretKey: bufferize(this.account.encrypted_secret_key),
      nonce: bufferize(this.account.encrypted_secret_key_nonce),
      tag: bufferize(this.account.encrypted_secret_key_tag)
    }

    this.initParams = {
      walletIndices: this.walletIndices,
      encryptionKey: keys.encryptionKey,
      aead,
      marketData: mapMarketsForNashProtocol(this.marketData),
      assetData: this.assetData
    }

    this.nashCoreConfig = await initialize(this.initParams)
    if (this.opts.debug) {
      console.log(this.nashCoreConfig)
    }

    if (presetWallets !== undefined) {
      const cloned: any = { ...this.nashCoreConfig }
      cloned.wallets = presetWallets
      this.nashCoreConfig = cloned
    }

    this.publicKey = this.nashCoreConfig.payloadSigningKey.publicKey
    // after login we should always try to get asset nonces
    await this.updateTradedAssetNonces()
  }

  private async doTwoFactorLogin(twoFaCode: string): Promise<any> {
    const twoFaResult = await this.gql.mutate({
      mutation: USER_2FA_LOGIN_MUTATION,
      variables: { code: twoFaCode }
    })
    try {
      const result = twoFaResult.data.twoFactorLogin as TwoFactorLoginResponse
      const twoFAaccount = result.account
      const wallets = {}
      twoFAaccount.wallets.forEach(w => {
        wallets[w.blockchain.toLowerCase()] = w.chainIndex
      })
      this.walletIndices = wallets
      return {
        encrypted_secret_key: twoFAaccount.encryptedSecretKey,
        encrypted_secret_key_nonce: twoFAaccount.encryptedSecretKeyNonce,
        encrypted_secret_key_tag: twoFAaccount.encryptedSecretKeyTag
      }
    } catch (e) {
      return {
        type: 'error',
        message: twoFaResult.errors
      }
    }
  }
  private async createAndUploadKeys(
    encryptionKey: Buffer,
    casCookie: string,
    presetWallets?: object
  ): Promise<void> {
    const secretKey = getSecretKey()
    const res = encryptSecretKey(encryptionKey, secretKey)
    const aead = {
      encryptedSecretKey: res.encryptedSecretKey,
      tag: res.tag,
      nonce: res.nonce
    }

    this.initParams = {
      walletIndices: this.walletIndices,
      encryptionKey,
      aead,
      marketData: mapMarketsForNashProtocol(this.marketData),
      assetData: this.assetData
    }

    this.nashCoreConfig = await initialize(this.initParams)

    if (presetWallets !== undefined) {
      const cloned: any = { ...this.nashCoreConfig }
      cloned.wallets = presetWallets
      this.nashCoreConfig = cloned
    }

    this.publicKey = this.nashCoreConfig.payloadSigningKey.publicKey

    const url = this.casUri + '/auth/add_initial_wallets_and_client_keys'
    const body = {
      encrypted_secret_key: toHex(this.initParams.aead.encryptedSecretKey),
      encrypted_secret_key_nonce: toHex(this.initParams.aead.nonce),
      encrypted_secret_key_tag: toHex(this.initParams.aead.tag),
      signature_public_key: this.nashCoreConfig.payloadSigningKey.publicKey,
      // TODO(@anthdm): construct the wallets object in more generic way.
      wallets: [
        {
          address: this.nashCoreConfig.wallets.neo.address,
          blockchain: 'neo',
          public_key: this.nashCoreConfig.wallets.neo.publicKey
        },
        {
          address: this.nashCoreConfig.wallets.eth.address,
          blockchain: 'eth',
          public_key: this.nashCoreConfig.wallets.eth.publicKey
        },
        {
          address: this.nashCoreConfig.wallets.btc.address,
          blockchain: 'btc',
          public_key: this.nashCoreConfig.wallets.btc.publicKey
        }
      ]
    }

    const response = await fetch(url, {
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json', cookie: casCookie },
      method: 'POST'
    })

    const result = await response.json()
    if (result.error) {
      throw new Error(result.message)
    }
    if (this.opts.debug) {
      console.log('successfully uploaded wallet keys to the CAS')
    }
  }

  /**
   * Get a single [[Ticker]] for the given market name.
   *
   * @param marketName
   * @returns
   *
   * Example
   * ```
   * const ticker = await nash.getTicker('neo_gas')
   * console.log(ticker)
   * ```
   */
  public async getTicker(marketName: string): Promise<Ticker> {
    checkMandatoryParams({ marketName, Type: 'string' })

    const result = await this.gql.query<{ getTicker: Ticker }>({
      query: GET_TICKER,
      variables: { marketName }
    })
    return result.data.getTicker
    // if(payload.type === "error") return payload

    // return ticker
  }

  /**
   * Get the [[OrderBook]] for the given market.
   *
   * @param marketName
   * @returns
   *
   * Example
   * ```
   * const orderBook = await nash.getOrderBook('neo_gas')
   * console.log(orderBook.bids)
   * ```
   */
  public async getOrderBook(marketName: string): Promise<OrderBook> {
    checkMandatoryParams({ marketName, Type: 'string' })

    const result = await this.gql.query<{ getOrderBook: OrderBook }>({
      query: GET_ORDERBOOK,
      variables: { marketName }
    })
    return result.data.getOrderBook
  }

  /**
   * Get [[TradeHistory]] for the given market name.
   *
   * @param marketName
   * @param limit
   * @param before
   * @returns
   *
   * Example
   * ```
   * const tradeHistory = await nash.listTrades({
   *   marketname : 'neo_gas'
   * })
   * console.log(tradeHistory.trades)
   * ```
   */
  public async listTrades({
    marketName,
    limit,
    before
  }: ListTradeParams): Promise<TradeHistory> {
    checkMandatoryParams({ marketName, Type: 'string' })
    const result = await this.gql.query<{ listTrades: TradeHistory }>({
      query: LIST_TRADES,
      variables: { marketName, limit, before }
    })
    return result.data.listTrades
  }

  /**
   * Fetches as list of all available [[Ticker]] that are active on the exchange.
   *
   * @returns
   *
   * Example
   * ```
   * const tickers = await nash.listTickers()
   * console.log(tickers)
   * ```
   */
  public async listTickers(): Promise<Ticker[]> {
    const result = await this.gql.query<{ listTickers: Ticker[] }>({
      query: LIST_TICKERS
    })
    return result.data.listTickers
  }

  /**
   * Fetches as list of all available [[Asset]] that are active on the exchange.
   *
   * @returns
   *
   * Example
   * ```
   * const assets = await nash.listAssets()
   * console.log(assets)
   * ```
   */
  public async listAssets(): Promise<Asset[]> {
    const result = await this.gql.query<{ listAssets: Asset[] }>({
      query: LIST_ASSETS_QUERY
    })
    return result.data.listAssets
  }

  /**
   * List a [[CandleRange]] for the given market.
   *
   * @param marketName
   * @param before
   * @param interval
   * @param limit
   * @returns
   *
   * Example
   * ```
   * const candleRange = await nash.listCandles({
   *   marketName : 'neo_gas'
   * })
   * console.log(candleRange)
   * ``
   */

  public async listCandles({
    marketName,
    before,
    interval,
    limit
  }: ListCandlesParams): Promise<CandleRange> {
    checkMandatoryParams({ marketName, Type: 'string' })
    const result = await this.gql.query<{ listCandles: CandleRange }>({
      query: LIST_CANDLES,
      variables: { marketName, before, interval, limit }
    })
    return result.data.listCandles
  }

  /**
   * List all available markets.
   *
   * @returns
   *
   * Example
   * ```
   * const markets = await nash.listMarkets()
   * console.log(markets)
   * ```
   */
  public async listMarkets(): Promise<Market[]> {
    const result = await this.gql.query<{ listMarkets: Market[] }>({
      query: LIST_MARKETS_QUERY
    })
    return result.data.listMarkets
  }

  /**
   * Get a specific [[Market]] by name.
   *
   * @param marketName
   * @returns
   *
   * Example
   * ```
   * const market = await nash.getMarket('neo_gas')
   * console.log(market)
   * ```
   */

  public async getMarket(marketName: string): Promise<Market> {
    checkMandatoryParams({ marketName, Type: 'string' })
    const result = await this.gql.query<{ getMarkets: Market }>({
      query: GET_MARKET_QUERY,
      variables: { marketName }
    })
    return result.data.getMarkets
  }

  /**
   * list available orders for the current authenticated account.
   * @param before
   * @param buyOrSell
   * @param limit
   * @param marketName
   * @param rangeStart
   * @param rangeStop
   * @param status
   * @param type
   * @returns
   *
   * Example
   * ```
   * const accountOrder = await nash.listAccountOrders({
   *   marketName : 'neo_eth'
   * })
   * console.log(accountOrder.orders)
   * ```
   */
  public async listAccountOrders({
    before,
    buyOrSell,
    limit,
    marketName,
    rangeStart,
    rangeStop,
    status,
    type,
    shouldIncludeTrades
  }: ListAccountOrderParams = {}): Promise<AccountOrder> {
    const query = shouldIncludeTrades
      ? LIST_ACCOUNT_ORDERS_WITH_TRADES
      : LIST_ACCOUNT_ORDERS

    const result = await this.gql.query<{ listAccountOrders: AccountOrder }>({
      query,
      variables: {
        payload: {
          before,
          buyOrSell,
          limit,
          marketName,
          rangeStart,
          rangeStop,
          status,
          type
        }
      }
    })
    return result.data.listAccountOrders
  }

  /**
   * list available trades for the current authenticated account.
   *
   * @param {ListAccountTradeParams} params
   * @returns
   *
   * Example
   * ```
   * const tradeHistory = await nash.listAccountTrades({
   *   limit : 10,
   *   marketName : 'neo_eth'
   * })
   * console.log(tradeHistory.trades)
   * ```
   */
  public async listAccountTrades({
    before,
    limit,
    marketName
  }: ListAccountTradeParams = {}): Promise<TradeHistory> {
    const result = await this.gql.query<{ listAccountTrades: TradeHistory }>({
      query: LIST_ACCOUNT_TRADES,
      variables: {
        payload: {
          before,
          limit,
          marketName
        }
      }
    })
    return result.data.listAccountTrades
  }

  /**
   * List available account transactions.
   *
   * @param cursor
   * @param fiatSymbol
   * @param limit
   * @returns
   *
   * Example
   * ```
   * const accountTransaction = await nash.listAccountTransactions({
   *   limit : 150,
   *   ${paramName} : ${paramValue}
   * })
   * console.log(accountTransaction.transactions)
   * ```
   */
  public async listAccountTransactions({
    cursor,
    fiatSymbol,
    limit
  }: ListAccountTransactionsParams = {}): Promise<AccountTransaction> {
    const result = await this.gql.query<{
      listAccountTransactions: AccountTransaction
    }>({
      query: LIST_ACCOUNT_TRANSACTIONS,
      variables: {
        payload: {
          cursor,
          fiatSymbol,
          limit
        }
      }
    })
    return result.data.listAccountTransactions
  }

  /**
   * List all balances for current authenticated account.
   *
   * @param ignoreLowBalance
   * @returns
   *
   * Example
   * ```
   * const accountBalance = await nash.listAccountBalances()
   * console.log(accountBalance)
   * ```
   */
  public async listAccountBalances(
    ignoreLowBalance
  ): Promise<AccountBalance[]> {
    const result = await this.gql.query<{
      listAccountBalances: AccountBalance[]
    }>({
      query: LIST_ACCOUNT_BALANCES,
      variables: {
        payload: { ignoreLowBalance }
      }
    })
    return result.data.listAccountBalances
  }

  /**
   * Get the deposit address for the given crypto currency.
   *
   * @param currency
   * @returns
   *
   * Example
   * ```
   * import { CryptoCurrency } from '@neon-exchange/api-client-typescript'
   *
   * const address = await nash.getAccountAddress(CryptoCurrency.NEO)
   * console.log(address)
   * ```
   */
  public async getAccountAddress(
    currency: CryptoCurrency
  ): Promise<GetAccountAddressResult['getAccountAddress']> {
    checkMandatoryParams({ currency, Type: 'string' })

    const result = await this.gql.query<
      GetAccountAddressResult,
      GetAccountAddressParams
    >({
      query: GET_ACCOUNT_ADDRESS,
      variables: {
        payload: { currency }
      }
    })
    return result.data.getAccountAddress
  }

  /**
   * @param  {CryptoCurrency} currency [description]
   * @return {Promise}                 [description]
   *
   * @deprecated will be removed in next major version use getAccountAddress
   */
  public getDepositAddress(
    currency: CryptoCurrency
  ): Promise<GetAccountAddressResult['getAccountAddress']> {
    return this.getAccountAddress(currency)
  }

  /**
   * Get the [[AccountPortfolio]] for the current authenticated account.
   *
   * @param fiatSymbol
   * @param period
   * @returns
   *
   * Example
   * ```
   * const accountPortfolio = await nash.getAccountPortfolio({
   *   fiatSymbol: "USD",
   *
   * })
   * console.log(accountPortfolio)
   * ```
   */

  public async getAccountPortfolio({
    fiatSymbol,
    period
  }: GetAccountPortfolioParams = {}): Promise<AccountPortfolio> {
    const result = await this.gql.query<{
      getAccountPortfolio: AccountPortfolio
    }>({
      query: GET_ACCOUNT_PORTFOLIO,
      variables: {
        payload: {
          fiatSymbol,
          period
        }
      }
    })
    return result.data.getAccountPortfolio
  }

  /**
   * Get a [[Movement]] by the given id.
   *
   * @param movementID
   * @returns
   *
   * Example
   * ```
   * const movement = await nash.getMovement(1)
   * console.log(movement)
   * ```
   */
  public async getMovement(movementID: number): Promise<Movement> {
    checkMandatoryParams({ movementID, Type: 'number' })

    const getMovemementParams = createGetMovementParams(movementID)
    const signedPayload = await this.signPayload(getMovemementParams)

    const result = await this.gql.query<{ getMovement: Movement }>({
      query: GET_MOVEMENT,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    })
    return result.data.getMovement
  }

  /**
   * Get [[AccountBalance]] for the given crypto currency.
   *
   * @param currency
   * @returns
   *
   * Example
   * ```
   * import { CryptoCurrency } from '@neon-exchange/api-client-typescript'
   *
   * const accountBalance = await nash.getAcountBalance(CryptoCurrency.ETH)
   * console.log(accountBalance)
   * ```
   */
  public async getAccountBalance(
    currency: CryptoCurrency
  ): Promise<AccountBalance> {
    checkMandatoryParams({ currency, Type: 'string' })

    const result = await this.gql.query<{ getAccountBalance: AccountBalance }>({
      query: GET_ACCOUNT_BALANCE,
      variables: {
        payload: { currency }
      }
    })
    return result.data.getAccountBalance
  }

  /**
   * Get an order by ID.
   *
   * @param orderId
   * @returns
   *
   * Example
   * ```
   * const order = await nash.getAccountOrder('999')
   * console.log(order)
   * ```
   */
  public async getAccountOrder(orderId: string): Promise<Order> {
    checkMandatoryParams({ orderId, Type: 'string' })

    const result = await this.gql.query<{ getAccountOrder: Order }>({
      query: GET_ACCOUNT_ORDER,
      variables: {
        payload: { orderId }
      }
    })
    return result.data.getAccountOrder
  }

  /**
   * List all movements for the current authenticated account.
   *
   * @param currency
   * @param status
   * @param type
   * @returns
   *
   * Example
   * ```
   * const movements = await nash.listMovements({
   *   currency : 'eth'
   * })
   * console.log(movements)
   * ```
   */
  public async listMovements({
    currency,
    status,
    type
  }: ListMovementsParams): Promise<Movement[]> {
    const listMovementParams = createListMovementsParams(currency, status, type)
    const signedPayload = await this.signPayload(listMovementParams)

    const result = await this.gql.query<{ listMovements: Movement[] }>({
      query: LIST_MOVEMENTS,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    })
    return result.data.listMovements
  }

  /**
   * List all orders for a given movement
   *
   * @returns
   *
   * Example
   * ```
   * const getOrdersForMovementData = await nash.getOrdersForMovement(unit)
   * console.log(getOrdersForMovementData)
   * ```
   */
  public async getOrdersForMovement(
    asset: string
  ): Promise<OrdersForMovementData> {
    checkMandatoryParams({ asset, Type: 'string' })
    const getOrdersForMovementParams = createGetOrdersForMovementParams(asset)
    const signedPayload = await this.signPayload(getOrdersForMovementParams)
    const result = await this.gql.query<{
      getOrdersForMovement: OrdersForMovementData
    }>({
      query: GET_ORDERS_FOR_MOVEMENT_QUERY,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    })

    return result.data.getOrdersForMovement
  }

  /**
   * List all current asset nonces
   *
   * @returns
   *
   * Example
   * ```
   * const getNoncesData = await nash.getAssetNonces()
   * console.log(getNoncesData)
   * ```
   */
  public async getAssetNonces(
    assetList: string[]
  ): Promise<AssetsNoncesData[]> {
    const getAssetNoncesParams = createGetAssetsNoncesParams(assetList)
    const signedPayload = await this.signPayload(getAssetNoncesParams)
    const result = await this.gql.query<{
      getAssetsNonces: GetAssetsNoncesData
    }>({
      query: GET_ASSETS_NONCES_QUERY,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    })
    return result.data.getAssetsNonces
  }

  /**
   * Gets Balance States, Signs Balance States, then Syncs Balance states to the server
   *
   * @returns
   *
   * Example
   * ```
   * const getSignSyncStates = await nash.getSignAndSyncStates()
   * console.log(getSignSyncStates)
   * ```
   */
  public async getSignAndSyncStates(): Promise<SyncStatesData> {
    const emptyStates: GetStatesData = {
      states: [],
      recycledOrders: [],
      serverSignedStates: []
    }
    const signStatesRecursive: SignStatesData = await this.signStates(
      emptyStates
    )
    const syncResult = await this.syncStates(signStatesRecursive)
    return syncResult
  }

  private state_map_from_states(states): any {
    return states.map(state => {
      return {
        blockchain: state.blockchain,
        message: state.message
      }
    })
  }

  /**
   * Submit all states and open orders to be signed for settlement
   *
   * @returns
   *
   * Example
   * ```
   * const signStatesResult = await nash.signStates(getStatesResult)
   * console.log(signStatesResult)
   * ```
   */
  public async signStates(
    getStatesData: GetStatesData,
    depth: number = 0
  ): Promise<SignStatesData> {
    if (depth > MAX_SIGN_STATE_RECURSION) {
      throw new Error('Max sign state recursion reached.')
    }

    const signStateListPayload: PayloadAndKind = createSignStatesParams(
      this.state_map_from_states(getStatesData.states),
      this.state_map_from_states(getStatesData.recycledOrders)
    )

    const signedStates: any = await this.signPayload(signStateListPayload)

    try {
      const result = await this.gql.mutate({
        mutation: SIGN_STATES_MUTATION,
        variables: {
          payload: signedStates.signedPayload,
          signature: signedStates.signature
        }
      })

      const signStatesData = result.data as SignStatesData

      // this is the response, we will send them in to be signed in the next recursive call
      const states_requiring_signing: States = this.state_map_from_states(
        signStatesData.signStates.states
      )

      // this is all the server signed states.  We don't really use/need these but it is good
      // for the client to have them
      const all_server_signed_states: SignStatesFields[] = getStatesData.serverSignedStates.concat(
        this.state_map_from_states(signStatesData.signStates.serverSignedStates)
      )

      // keep a list of all states that have been signed so we can sync them
      const all_states_to_sync = getStatesData.states.concat(
        states_requiring_signing
      )

      // if input states to be signed are different than result, and that list has a length
      // we recursively call this method until the signStates calls are exhausted
      // with a max recursion depth of 5
      if (
        states_requiring_signing !== getStatesData.states &&
        states_requiring_signing.length > 0
      ) {
        const recursiveStates: GetStatesData = {
          states: states_requiring_signing,
          recycledOrders: signStatesData.signStates.recycledOrders,
          serverSignedStates: all_server_signed_states
        }

        return this.signStates(recursiveStates, depth + 1)
      }

      // the result should have all the states that were signed by the server
      // and all the states signed by the client in order to call syncStates
      signStatesData.signStates.serverSignedStates = all_server_signed_states
      signStatesData.signStates.states = all_states_to_sync

      return signStatesData
    } catch (e) {
      console.error('Could not sign states: ', e)
      return e
    }
  }

  /**
   * List all states and open orders to be signed for settlement
   *
   * @returns
   *
   * Example
   * ```
   * const getStatesData = await nash.getStates()
   * console.log(getStatesData)
   * ```
   */
  public async syncStates(
    signStatesData: SignStatesData
  ): Promise<SyncStatesData> {
    const stateList: SyncState[] = signStatesData.signStates.serverSignedStates.map(
      state => {
        return {
          blockchain: state.blockchain,
          message: state.message
        }
      }
    )
    const syncStatesParams = createSyncStatesParams(stateList)
    const signedPayload = await this.signPayload(syncStatesParams)

    const result = await this.gql.mutate<{ syncStates: SyncStatesData }>({
      mutation: SYNC_STATES_MUTATION,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    })
    // after syncing states, we should always update asset nonces
    await this.updateTradedAssetNonces()

    return result.data.syncStates
  }

  /**
   * Cancel an order by ID.
   *
   * @param orderID
   * @returns
   *
   * Example
   * ```
   * const cancelledOrder = await nash.cancelOrder('11')
   * console.log(cancelledOrder)
   * ```
   */
  public async cancelOrder(
    orderID: string,
    marketName: string
  ): Promise<CancelledOrder> {
    const cancelOrderParams = createCancelOrderParams(orderID, marketName)
    const signedPayload = await this.signPayload(cancelOrderParams)

    const result = await this.gql.mutate({
      mutation: CANCEL_ORDER_MUTATION,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    })
    const cancelledOrder = result.data.cancelOrder as CancelledOrder

    return cancelledOrder
  }

  /**
   * Cancel all orders by market name
   *
   * @param marketName
   * @returns
   *
   * Example
   * ```
   * const result = await nash.cancelAllOrders('neo_gas')
   * console.log(result)
   * ```
   */
  public async cancelAllOrders(marketName?: string): Promise<boolean> {
    let cancelAllOrderParams: any = {
      timestamp: createTimestamp()
    }

    if (marketName !== undefined) {
      cancelAllOrderParams = {
        marketName,
        timestamp: createTimestamp()
      }
    }
    const payloadAndKind = {
      kind: SigningPayloadID.cancelAllOrdersPayload,
      payload: cancelAllOrderParams
    }
    const signedPayload = await this.signPayload(payloadAndKind)
    const result = await this.gql.mutate({
      mutation: CANCEL_ALL_ORDERS_MUTATION,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    })
    const cancelledOrder = result.data.cancelAllOrders.accepted

    return cancelledOrder
  }

  /**
   * Place a limit order.
   *
   * @param allowTaker
   * @param amount
   * @param buyOrSell
   * @param cancelationPolicy
   * @param limitPrice
   * @param marketName
   * @param cancelAt
   * @returns
   *
   * Example
   * ```typescript
   * import {
   *   createCurrencyAmount,
   *   createCurrencyPrice,
   *   OrderBuyOrSell,
   *   OrderCancellationPolicy
   * } from '@neon-exchange/api-client-typescript'
   *
   * const order = await nash.placeLimitOrder(
   *   false,
   *   createCurrencyAmount('1', CryptoCurrency.NEO),
   *   OrderBuyOrSell.BUY,
   *   OrderCancellationPolicy.GOOD_TIL_CANCELLED,
   *   createCurrencyPrice('0.01', CryptoCurrency.GAS, CryptoCurrency.NEO),
   *   'neo_gas'
   * )
   * console.log(order.status)
   * ```
   */
  public async placeLimitOrder(
    allowTaker: boolean,
    amount: CurrencyAmount,
    buyOrSell: OrderBuyOrSell,
    cancellationPolicy: OrderCancellationPolicy,
    limitPrice: CurrencyPrice,
    marketName: string,
    cancelAt?: DateTime
  ): Promise<OrderPlaced> {
    checkMandatoryParams(
      {
        allowTaker,
        Type: 'boolean'
      },
      {
        amount,
        limitPrice,
        Type: 'object'
      },
      {
        cancellationPolicy,
        buyOrSell,
        marketName,
        Type: 'string'
      }
    )

    const { nonceOrder, noncesFrom, noncesTo } = this.getNoncesForTrade(
      marketName,
      buyOrSell
    )
    const normalizedAmount = normalizeAmountForMarket(
      amount,
      this.marketData[marketName]
    )
    const normalizedLimitPrice = normalizePriceForMarket(
      limitPrice,
      this.marketData[marketName]
    )
    const placeLimitOrderParams = createPlaceLimitOrderParams(
      allowTaker,
      normalizedAmount,
      buyOrSell,
      cancellationPolicy,
      normalizedLimitPrice,
      marketName,
      noncesFrom,
      noncesTo,
      nonceOrder,
      cancelAt
    )

    const signedPayload = await this.signPayload(placeLimitOrderParams)
    try {
      const result = await this.gql.mutate<{
        placeLimitOrder: OrderPlaced
      }>({
        mutation: PLACE_LIMIT_ORDER_MUTATION,
        variables: {
          payload: signedPayload.signedPayload,
          signature: signedPayload.signature
        }
      })
      return result.data.placeLimitOrder
    } catch (e) {
      if (e.message.includes(MISSING_NONCES)) {
        await this.updateTradedAssetNonces()
        return await this.placeLimitOrder(
          allowTaker,
          amount,
          buyOrSell,
          cancellationPolicy,
          limitPrice,
          marketName,
          cancelAt
        )
      }

      return this.handleOrderError(e, signedPayload)
    }
  }

  /**
   * Place a market order.
   *
   * @param amount
   * @param buyOrSell
   * @param marketName
   * @returns
   *
   * Example
   * ```typescript
   * import {
   *   createCurrencyAmount,
   *   OrderBuyOrSell,
   * } from '@neon-exchange/api-client-typescript'
   *
   * const order = await nash.placeMarketOrder(
   *   createCurrencyAmount('1.00', CryptoCurrency.NEO),
   *   OrderBuyOrSell.SELL,
   *   'neo_gas'
   * )
   * console.log(order.status)
   * ```
   */
  public async placeMarketOrder(
    amount: CurrencyAmount,
    buyOrSell: OrderBuyOrSell,
    marketName: string
  ): Promise<OrderPlaced> {
    checkMandatoryParams({
      buyOrSell,
      marketName,
      Type: 'string'
    })
    const { nonceOrder, noncesFrom, noncesTo } = this.getNoncesForTrade(
      marketName,
      buyOrSell
    )
    const normalizedAmount = normalizeAmountForMarket(
      amount,
      this.marketData[marketName]
    )
    const placeMarketOrderParams = createPlaceMarketOrderParams(
      normalizedAmount,
      buyOrSell,
      marketName,
      noncesFrom,
      noncesTo,
      nonceOrder
    )
    const signedPayload = await this.signPayload(placeMarketOrderParams)
    try {
      const result = await this.gql.mutate<{
        placeMarketOrder: OrderPlaced
      }>({
        mutation: PLACE_MARKET_ORDER_MUTATION,
        variables: {
          payload: signedPayload.signedPayload,
          signature: signedPayload.signature
        }
      })
      return result.data.placeMarketOrder
    } catch (e) {
      if (e.message.includes(MISSING_NONCES)) {
        await this.updateTradedAssetNonces()
        return await this.placeMarketOrder(amount, buyOrSell, marketName)
      }
      return this.handleOrderError(e, signedPayload)
    }
  }

  /**
   * Place a stop limit order.
   *
   * @param allowTaker
   * @param amount
   * @param buyOrSell
   * @param cancellationPolicy
   * @param limitPrice
   * @param marketName
   * @param stopPrice
   * @param cancelAt
   * @returns
   *
   * Example
   * ```typescript
   * import {
   *   createCurrencyAmount,
   *   createCurrencyPrice,
   *   OrderBuyOrSell,
   *   OrderCancellationPolicy
   * } from '@neon-exchange/api-client-typescript'
   *
   * const order = await nash.placeStopLimitOrder(
   *   false,
   *   createCurrencyAmount('1', CryptoCurrency.NEO),
   *   OrderBuyOrSell.BUY,
   *   OrderCancellationPolicy.GOOD_TIL_CANCELLED,
   *   createCurrencyPrice('0.01', CryptoCurrency.GAS, CryptoCurrency.NEO),
   *   'neo_gas'
   *   createCurrencyPrice('0.02', CryptoCurrency.GAS, CryptoCurrency.NEO)
   * )
   * console.log(order.status)
   * ```
   */
  public async placeStopLimitOrder(
    allowTaker: boolean,
    amount: CurrencyAmount,
    buyOrSell: OrderBuyOrSell,
    cancellationPolicy: OrderCancellationPolicy,
    limitPrice: CurrencyPrice,
    marketName: string,
    stopPrice: CurrencyPrice,
    cancelAt?: DateTime
  ): Promise<OrderPlaced> {
    checkMandatoryParams(
      { allowTaker, Type: 'boolean' },
      { buyOrSell, marketName, cancellationPolicy, Type: 'string' },
      { cancelAt: 'number' }
    )
    const { nonceOrder, noncesFrom, noncesTo } = this.getNoncesForTrade(
      marketName,
      buyOrSell
    )

    const normalizedAmount = normalizeAmountForMarket(
      amount,
      this.marketData[marketName]
    )
    const normalizedLimitPrice = normalizePriceForMarket(
      limitPrice,
      this.marketData[marketName]
    )
    const normalizedStopPrice = normalizePriceForMarket(
      stopPrice,
      this.marketData[marketName]
    )
    const placeStopLimitOrderParams = createPlaceStopLimitOrderParams(
      allowTaker,
      normalizedAmount,
      buyOrSell,
      cancellationPolicy,
      normalizedLimitPrice,
      marketName,
      normalizedStopPrice,
      noncesFrom,
      noncesTo,
      nonceOrder,
      cancelAt
    )
    const signedPayload = await this.signPayload(placeStopLimitOrderParams)
    try {
      const result = await this.gql.mutate<{
        placeStopLimitOrder: OrderPlaced
      }>({
        mutation: PLACE_STOP_LIMIT_ORDER_MUTATION,
        variables: {
          payload: signedPayload.signedPayload,
          signature: signedPayload.signature
        }
      })

      return result.data.placeStopLimitOrder
    } catch (e) {
      if (e.message.includes(MISSING_NONCES)) {
        await this.updateTradedAssetNonces()
        return await this.placeStopLimitOrder(
          allowTaker,
          amount,
          buyOrSell,
          cancellationPolicy,
          limitPrice,
          marketName,
          stopPrice,
          cancelAt
        )
      }

      return this.handleOrderError(e, signedPayload)
    }
  }

  /**
   * Place a stop market order.
   *
   * @param amount
   * @param buyOrSell
   * @param marketName
   * @param stopPrice
   * @returns
   *
   * Example
   * ```typescript
   * import {
   *   createCurrencyAmount,
   *   createCurrencyPrice,
   *   OrderBuyOrSell,
   * } from '@neon-exchange/api-client-typescript'
   *
   * const order = await nash.placeStopLimitOrder(
   *   createCurrencyAmount('1', CryptoCurrency.NEO),
   *   OrderBuyOrSell.BUY,
   *   'neo_gas'
   *   createCurrencyPrice('0.02', CryptoCurrency.GAS, CryptoCurrency.NEO)
   * )
   * console.log(order.status)
   * ```
   */
  public async placeStopMarketOrder(
    amount: CurrencyAmount,
    buyOrSell: OrderBuyOrSell,
    marketName: string,
    stopPrice: CurrencyPrice
  ): Promise<OrderPlaced> {
    checkMandatoryParams(
      { amount, stopPrice, Type: 'object' },
      { buyOrSell, marketName, Type: 'string' }
    )

    const { nonceOrder, noncesFrom, noncesTo } = this.getNoncesForTrade(
      marketName,
      buyOrSell
    )

    const normalizedAmount = normalizeAmountForMarket(
      amount,
      this.marketData[marketName]
    )
    const normalizedStopPrice = normalizePriceForMarket(
      stopPrice,
      this.marketData[marketName]
    )

    const placeStopMarketOrderParams = createPlaceStopMarketOrderParams(
      normalizedAmount,
      buyOrSell,
      marketName,
      normalizedStopPrice,
      noncesFrom,
      noncesTo,
      nonceOrder
    )
    const signedPayload = await this.signPayload(placeStopMarketOrderParams)
    try {
      const result = await this.gql.mutate<{
        placeStopMarketOrder: OrderPlaced
      }>({
        mutation: PLACE_STOP_MARKET_ORDER_MUTATION,
        variables: {
          payload: signedPayload.signedPayload,
          signature: signedPayload.signature
        }
      })
      return result.data.placeStopMarketOrder
    } catch (e) {
      if (e.message.includes(MISSING_NONCES)) {
        await this.updateTradedAssetNonces()
        return await this.placeStopMarketOrder(
          amount,
          buyOrSell,
          marketName,
          stopPrice
        )
      }

      return this.handleOrderError(e, signedPayload)
    }
  }

  private handleOrderError(error: Error, signedPayload: any): any {
    if (error.message.includes(MISSING_NONCES)) {
      this.updateTradedAssetNonces()
      throw new MissingNonceError(error.message, signedPayload)
    } else if (error.message.includes('Insufficient Funds')) {
      throw new InsufficientFundsError(error.message, signedPayload)
    }
    throw new Error(
      `Could not place order: ${error.message} using payload: ${JSON.stringify(
        signedPayload.blockchain_raw
      )}`
    )
  }

  public async signDepositRequest(
    address: string,
    quantity: CurrencyAmount,
    nonce?: number
  ): Promise<SignMovementResult> {
    const signMovementParams = createAddMovementParams(
      address,
      quantity,
      MovementTypeDeposit,
      nonce
    )
    const signedPayload = await this.signPayload(signMovementParams)
    const result = await this.gql.mutate<{ addMovement: AddMovement }>({
      mutation: ADD_MOVEMENT_MUTATION,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    })

    // after deposit or withdrawal we want to update nonces
    await this.updateTradedAssetNonces()

    return {
      result: {
        signature: result.data.addMovement.signature,
        publicKey: result.data.addMovement.publicKey,
        movement: result.data.addMovement
      },
      blockchain_data: signedPayload.blockchain_data
    }
  }

  public async queryAllowance(assetData: AssetData): Promise<BigNumber> {
    let approvalPower = assetData.blockchainPrecision
    if (assetData.symbol === CryptoCurrency.USDC) {
      approvalPower = this.isMainNet ? 6 : 18
    }
    const erc20Contract = new this.web3.eth.Contract(
      Erc20ABI,
      `0x${assetData.hash}`
    )
    try {
      const res = await erc20Contract.methods
        .allowance(
          `0x${this.apiKey.child_keys[BIP44.ETH].address}`,
          this.opts.ethNetworkSettings.contracts.vault.contract
        )
        .call()
      return new BigNumber(res).div(Math.pow(10, approvalPower))
    } catch (e) {
      return new BigNumber(0)
    }
  }

  private validateTransactionCost(gasPrice: string, estimate: number) {
    const maxCost = new BigNumber(gasPrice)
      .multipliedBy(2)
      .multipliedBy(estimate)
    if (this.maxEthCostPrTransaction.lt(maxCost)) {
      throw new Error(
        'Transaction ETH cost larger than maxEthCostPrTransaction (' +
          this.opts.maxEthCostPrTransaction +
          ')'
      )
    }
  }

  private async approveERC20Transaction(
    asset: AssetData,
    childKey: ChildKey,
    amount: BigNumber
  ): Promise<TransactionReceipt> {
    const chainId = await this.web3.eth.net.getId()
    const erc20Contract = await new this.web3.eth.Contract(
      Erc20ABI,
      '0x' + asset.hash
    )

    const approveAbi = erc20Contract.methods
      .approve(
        this.opts.ethNetworkSettings.contracts.vault.contract,
        this.web3.utils.numberToHex(
          transferExternalGetAmount(
            new BigNumber(amount),
            asset,
            this.isMainNet
          )
        )
      )
      .encodeABI()

    const ethApproveNonce = await this.web3.eth.getTransactionCount(
      '0x' + childKey.address
    )
    const nonce = '0x' + ethApproveNonce.toString(16)

    const estimate = await this.web3.eth.estimateGas({
      from: '0x' + this.apiKey.child_keys[BIP44.ETH].address,
      nonce: ethApproveNonce,
      to: '0x' + asset.hash,
      data: approveAbi
    })

    const gasPrice = await this.web3.eth.getGasPrice()
    this.validateTransactionCost(gasPrice, estimate)
    const approveTx = new EthTransaction({
      nonce, // + movement.data.assetNonce,
      gasPrice: '0x' + parseInt(gasPrice, 10).toString(16),
      gasLimit: '0x' + (estimate * 2).toString(16),
      to: '0x' + asset.hash,
      value: 0,
      data: approveAbi
    })
    approveTx.getChainId = () => chainId

    const approveSignature = await this.signEthTransaction(approveTx)
    setSignature(approveTx, approveSignature)

    const p = this.web3.eth.sendSignedTransaction(
      '0x' + approveTx.serialize().toString('hex')
    )

    return new Promise((resolve, reject) => {
      p.once('error', reject)
      p.once('receipt', resolve)
    })
  }

  private async approveAndAwaitAllowance(
    assetData: AssetData,
    childKey: ChildKey,
    amount: string
  ): Promise<void> {
    const bnAmount = new BigNumber(amount)
    const currentAllowance = await this.queryAllowance(assetData)
    if (currentAllowance.lt(bnAmount)) {
      await this.approveERC20Transaction(
        assetData,
        childKey,
        bnAmount.minus(currentAllowance)
      )

      // We will wait for allowance for up to 5 minutes. After which I think we should time out.
      for (let i = 0; i < 5 * 12 * 4; i++) {
        const latestAllowance = await this.queryAllowance(assetData)
        if (latestAllowance.gte(bnAmount)) {
          return
        }
        await sleep(5000)
      }
      throw new Error('Eth approval timed out')
    }
  }

  public async transferToExternal(params: {
    quantity: CurrencyAmount
    address: string
  }): Promise<{ txId: string; gasUsed?: number }> {
    this.requireMPC()
    const {
      quantity: { currency, amount },
      address
    } = params
    if (this.assetData == null) {
      throw new Error('Asset data null')
    }
    if (this.assetData[currency] == null) {
      throw new Error('Invalid asset: ' + currency)
    }
    const assetData = this.assetData[currency]
    const blockchain = assetData.blockchain
    if (this.opts.host === EnvironmentConfiguration.production.host) {
      const addrBlockchain = detectBlockchain(address)
      if (addrBlockchain === null) {
        throw new Error(
          `We can infer blockchain type from address ${address}. If you think this is an error please report it.`
        )
      }
      if (addrBlockchain !== blockchain) {
        throw new Error(
          `You are attempted to send a ${blockchain} asset, but address is infered to be ${addrBlockchain}`
        )
      }
    }

    const childKey = this.apiKey.child_keys[
      BLOCKCHAIN_TO_BIP44[blockchain.toUpperCase() as Blockchain]
    ]
    switch (blockchain) {
      case 'eth':
        const chainId = await this.web3.eth.net.getId()
        const ethAccountNonce = await this.web3.eth.getTransactionCount(
          '0x' + childKey.address
        )
        const value =
          currency === CryptoCurrency.ETH ? this.web3.utils.toWei(amount) : '0'

        let data = ''
        if (currency !== CryptoCurrency.ETH) {
          const erc20Contract = new this.web3.eth.Contract(
            Erc20ABI,
            `0x${assetData.hash}`
          )
          data = erc20Contract.methods
            .transfer(
              prefixWith0xIfNeeded(address),
              this.web3.utils.numberToHex(
                transferExternalGetAmount(
                  new BigNumber(amount),
                  assetData,
                  this.isMainNet
                )
              )
            )
            .encodeABI()
        }

        const gasPrice = await this.web3.eth.getGasPrice()
        const estimate = await this.web3.eth.estimateGas({
          from: prefixWith0xIfNeeded(this.apiKey.child_keys[BIP44.ETH].address),
          nonce: ethAccountNonce,
          to: prefixWith0xIfNeeded(
            currency === CryptoCurrency.ETH
              ? '0x7C291eB2D2Ec9A35dba0e2C395c5928cd7d90e51'
              : assetData.hash
          ),
          value,
          data
        })

        this.validateTransactionCost(gasPrice, estimate)
        const ethTx = new EthTransaction({
          nonce: '0x' + ethAccountNonce.toString(16),
          gasPrice: '0x' + parseInt(gasPrice, 10).toString(16),
          gasLimit: '0x' + (estimate * 2).toString(16),
          to: prefixWith0xIfNeeded(
            currency !== CryptoCurrency.ETH ? assetData.hash : address
          ),
          value: '0x' + parseInt(value, 10).toString(16),
          data: data === '' ? undefined : data
        })

        ethTx.getChainId = () => chainId

        const ethTxSignature = await this.signEthTransaction(ethTx)
        setSignature(ethTx, ethTxSignature)
        const receipt = await this.web3.eth.sendSignedTransaction(
          '0x' + ethTx.serialize().toString('hex')
        )
        return {
          txId: receipt.transactionHash,
          gasUsed: receipt.gasUsed
        }
      case 'neo':
        let transaction: tx.Transaction
        const nodes = this.opts.neoNetworkSettings.nodes.reverse()
        const node = await findBestNetworkNode(nodes)
        const rpcClient = new NeonJS.rpc.RPCClient(node)
        const balance = await NeonJS.api.neoscan.getBalance(
          this.opts.neoScan,
          childKey.address
        )
        if (
          currency === CryptoCurrency.NEO ||
          currency === CryptoCurrency.GAS
        ) {
          transaction = NeonJS.default.create
            .contractTx()
            .addIntent(
              currency.toUpperCase(),
              new u.Fixed8(amount, 10),
              address
            )
        } else {
          const sendAmount = parseFloat(amount) * 1e8
          const timestamp = new BigNumber(this.createTimestamp32()).toString(16)
          transaction = new tx.InvocationTransaction({
            script: NeonJS.default.create.script({
              scriptHash: assetData.hash,
              operation: 'transfer',
              args: [
                sc.ContractParam.byteArray(childKey.address, 'address'),
                sc.ContractParam.byteArray(address, 'address'),
                sc.ContractParam.integer(sendAmount)
              ]
            }),
            gas: 0
          })
            .addAttribute(
              tx.TxAttrUsage.Script,
              u.reverseHex(wallet.getScriptHashFromAddress(childKey.address))
            )
            .addAttribute(tx.TxAttrUsage.Remark, timestamp)
        }
        transaction.calculate(balance)
        const payload = transaction.serialize(false)
        const signature = await this.signNeoPayload(payload.toLowerCase())
        transaction.addWitness(
          tx.Witness.fromSignature(signature, childKey.public_key)
        )
        const neoStatus = await rpcClient.sendRawTransaction(
          transaction.serialize(true)
        )

        if (!neoStatus) {
          throw new Error('Could not send neo')
        }
        return {
          txId: transaction.hash
        }
      case 'btc':
        const pubKey = Buffer.from(childKey.public_key, 'hex')
        const externalTransferAmount = new BigNumber(amount).toNumber()
        const { vins } = await this.getAccountAddress(CryptoCurrency.BTC)
        const utxos = vins.map(vin => {
          if (vin.value == null || vin.txid == null || vin.n == null) {
            throw new Error('Invalid vin')
          }
          return {
            txid: vin.txid,
            vout: vin.n,
            value: vin.value.amount as string,
            height: 0
          }
        })
        const btcGasPrice = await calculateFeeRate()
        const fee = calculateBtcFees(externalTransferAmount, btcGasPrice, utxos)
        const net = networkFromName(this.opts.btcNetworkSettings.name)
        const btcTx = new bitcoin.Psbt({ network: net })
        let utxoInputTotal = fee.times(-1)
        utxos.forEach(utxo => {
          utxoInputTotal = utxoInputTotal.plus(utxo.value)
        })

        let useAll = false
        if (utxoInputTotal.toFixed(8) === new BigNumber(amount).toFixed(8)) {
          useAll = true
        }
        const transferAmount = Math.round(
          new BigNumber(amount).times(BTC_SATOSHI_MULTIPLIER).toNumber()
        )

        const p2wpkh = bitcoin.payments.p2wpkh({
          network: net,
          pubkey: pubKey
        })
        // this payment is used by the p2sh payment
        const p2shPayment = bitcoin.payments.p2sh({
          network: net,
          redeem: p2wpkh
        })
        // this is the redeemScript used for the P2SH
        // It is of format 00 14 hash160(pubkey)
        if (p2shPayment.redeem == null || p2shPayment.redeem.output == null) {
          throw new Error('Invalid p2shPayment')
        }
        const redeem = p2shPayment.redeem.output

        // we recostruct the scriptPubkey from the redeem script
        // the format is 79 14 hash160(redeem) 87
        const myScript = Buffer.from(P2shP2wpkhScript(redeem))

        const allUtxo = utxos.map(utxo => ({
          ...utxo,
          txId: utxo.txid,
          value: new BigNumber(utxo.value)
            .times(BTC_SATOSHI_MULTIPLIER)
            .toNumber()
        }))

        let inputs
        let outputs
        if (useAll) {
          inputs = allUtxo
          outputs = [{ address, value: transferAmount }]
        } else {
          // Calculate inputs and outputs using coin selection algorithm
          const result = coinSelect(
            allUtxo,
            [{ address, value: transferAmount }],
            btcGasPrice
          )
          inputs = result.inputs
          outputs = result.outputs
        }

        if (!inputs || !outputs) {
          throw new Error('Insufficient funds')
        }
        for (const input of inputs) {
          const txInput = {
            hash: input.txId,
            index: input.vout,
            witnessUtxo: {
              script: myScript,
              value: input.value
            },
            redeemScript: redeem
          }
          // console.info("added input: ", txInput)
          btcTx.addInput(txInput)
        }
        for (const output of outputs) {
          btcTx.addOutput({
            address: output.address || childKey.address,
            value: output.value
          })
        }
        // Sign all inputs and build transaction
        const uTx = btcTx.data.globalMap.unsignedTx
        const uutx = ((uTx as never) as { tx: bitcoin.Transaction }).tx

        const presignatures: Array<{
          sighashType: number
          presig: CompleteBtcTransactionSignaturesArgs['inputPresigs'][0]
        }> = []

        for (let i = 0; i < inputs.length; i++) {
          // The function body of sign has been extracted as we want to sign this in our mpc way
          const { hash, sighashType } = getHashAndSighashType(
            btcTx.data.inputs,
            i,
            pubKey,
            ((btcTx as never) as { __CACHE: any }).__CACHE,
            [bitcoin.Transaction.SIGHASH_ALL]
          )
          const btcPayloadPresig = await computePresig({
            apiKey: {
              client_secret_share: childKey.client_secret_share,
              paillier_pk: this.apiKey.paillier_pk,
              public_key: childKey.public_key,
              server_secret_share_encrypted:
                childKey.server_secret_share_encrypted
            },
            blockchain: Blockchain.BTC,
            fillPoolFn: this.fillPoolFn,
            messageHash: hash.toString('hex')
          })

          presignatures.push({
            sighashType,
            presig: {
              signature: btcPayloadPresig.presig,
              r: btcPayloadPresig.r,
              amount: inputs[i].value
            }
          })
        }
        const completeBtcTransactionPayload = {
          payload: uutx.toBuffer().toString('hex'),
          publicKey: childKey.public_key,
          inputPresigs: presignatures.map(p => p.presig)
        }
        const completedInputSignatures = await this.completeBtcTransactionSignatures(
          completeBtcTransactionPayload
        )
        for (let i = 0; i < presignatures.length; i++) {
          const partialSig = [
            {
              pubkey: pubKey,
              signature: bitcoin.script.signature.encode(
                Buffer.from(
                  completedInputSignatures[i].slice(
                    0,
                    completedInputSignatures[i].length - 2
                  ),
                  'hex'
                ),
                presignatures[i].sighashType
              )
            }
          ]
          btcTx.data.updateInput(i, { partialSig })
          btcTx.validateSignaturesOfInput(i)
        }
        btcTx.finalizeAllInputs()
        const signedRawBtcTx = btcTx.extractTransaction().toHex()
        await this.sendBlockchainRawTransaction({
          payload: signedRawBtcTx,
          blockchain: Blockchain.BTC
        })
        return {
          txId: uutx.getId()
        }
      default:
        throw new Error('Unsupported blockchain ' + assetData.blockchain)
    }
  }

  private async signNeoPayload(payload: string): Promise<string> {
    const messageHash = u.sha256(payload)
    const childKey = this.apiKey.child_keys[BIP44.NEO]
    const payloadPresig = await computePresig({
      apiKey: {
        client_secret_share: childKey.client_secret_share,
        paillier_pk: this.apiKey.paillier_pk,
        public_key: childKey.public_key,
        server_secret_share_encrypted: childKey.server_secret_share_encrypted
      },
      blockchain: Blockchain.NEO,
      fillPoolFn: this.fillPoolFn,
      messageHash
    })
    const signature = await this.completePayloadSignature({
      blockchain: Blockchain.NEO,
      payload,
      public_key: childKey.public_key,
      signature: payloadPresig.presig,
      type: CompletePayloadSignatureType.Blockchain,
      r: payloadPresig.r
    })
    if (!wallet.verify(payload, signature, childKey.public_key)) {
      throw new Error('Completed signature not correct')
    }
    return signature
  }

  private async signEthTransaction(etx: EthTransaction): Promise<string> {
    const childKey = this.apiKey.child_keys[BIP44.ETH]
    const txSignature = await computePresig({
      apiKey: {
        client_secret_share: childKey.client_secret_share,
        paillier_pk: this.apiKey.paillier_pk,
        public_key: childKey.public_key,
        server_secret_share_encrypted: childKey.server_secret_share_encrypted
      },
      blockchain: Blockchain.ETH,
      fillPoolFn: this.fillPoolFn,
      messageHash: etx.hash(false).toString('hex')
    })

    const payload = serializeEthTx(etx)
    const invocationSignature = await this.completePayloadSignature({
      blockchain: Blockchain.ETH,
      payload: payload.toLowerCase(),
      public_key: childKey.public_key,
      signature: txSignature.presig,
      type: CompletePayloadSignatureType.Blockchain,
      r: txSignature.r
    })
    return invocationSignature
  }
  public depositToTradingContract(quantity: CurrencyAmount) {
    return this.transferToTradingContract(quantity, MovementTypeDeposit)
  }
  public withdrawFromTradingContract(quantity: CurrencyAmount) {
    return this.transferToTradingContract(quantity, MovementTypeWithdrawal)
  }
  private async prepareMovement(
    payload: Omit<PrepareMovementVariables['payload'], 'timestamp'>
  ): Promise<PrepareMovementData['prepareMovement']> {
    const signature = await this.signPayload({
      kind: SigningPayloadID.prepareMovementPayload,
      payload: {
        ...payload,
        timestamp: new Date().getTime()
      }
    })

    const data = await this.gql.mutate<
      PrepareMovementData,
      PrepareMovementVariables
    >({
      mutation: PREPARE_MOVEMENT_MUTATION,
      variables: {
        payload: signature.payload as PrepareMovementVariables['payload'],
        signature: signature.signature
      }
    })

    return data.data.prepareMovement
  }
  private async transferToTradingContract(
    quantity: CurrencyAmount,
    movementType: typeof MovementTypeDeposit | typeof MovementTypeWithdrawal
  ): Promise<{ txId: string }> {
    this.requireMPC()
    if (this.assetData == null) {
      throw new Error('Asset data null')
    }
    if (this.assetData[quantity.currency] == null) {
      throw new Error('Invalid asset: ' + quantity.currency)
    }
    const assetData = this.assetData[quantity.currency]
    const blockchain = assetData.blockchain
    const childKey = this.apiKey.child_keys[
      BLOCKCHAIN_TO_BIP44[blockchain.toUpperCase() as Blockchain]
    ]
    if (
      blockchain === TSAPIBlockchain.ETH &&
      movementType === MovementTypeDeposit &&
      quantity.currency !== CryptoCurrency.ETH
    ) {
      await this.approveAndAwaitAllowance(assetData, childKey, quantity.amount)
    }
    const address = childKey.address

    const preparedMovement = await this.prepareMovement({
      address,
      quantity: {
        amount: new BigNumber(quantity.amount).toFormat(8),
        currency: assetData.symbol
      },
      type: movementType
    })

    const amountBN = new BigNumber(quantity.amount)
    let movementAmount = new BigNumber(quantity.amount)

    if (
      quantity.currency === CryptoCurrency.BTC &&
      movementType === MovementTypeWithdrawal
    ) {
      const withdrawalFee = new BigNumber(preparedMovement.fees.amount)
      movementAmount = amountBN.plus(withdrawalFee)
    }

    const signedAddMovementPayload = await this.signPayload({
      payload: {
        address: childKey.address,
        nonce: preparedMovement.nonce,
        quantity: {
          amount: movementAmount.toFormat(8),
          currency: assetData.symbol
        },
        type: movementType,
        // eslint-disable-next-line @typescript-eslint/camelcase
        recycled_orders: preparedMovement.recycledOrders.map(
          ({ blockchain: orderBlockchain, message }) => ({
            blockchain: orderBlockchain,
            message
          })
        ),
        digests: preparedMovement.transactionElements.map(
          ({ digest: digest }) => ({ digest })
        ),
        timestamp: new Date().getTime()
      },
      kind: SigningPayloadID.addMovementPayload
    })
    const sanitizedPayload = sanitizeAddMovementPayload(
      signedAddMovementPayload.signedPayload as never
    )
    const addMovementResult = await this.gql.mutate<{
      addMovement: AddMovement
    }>({
      mutation: ADD_MOVEMENT_MUTATION,
      variables: {
        payload: sanitizedPayload,
        signature: signedAddMovementPayload.signature
      }
    })
    if (quantity.currency === CryptoCurrency.BTC) {
      return {
        txId: addMovementResult.data.addMovement.id.toString()
      }
    }
    const blockchainSignature = await this.completePayloadSignature({
      blockchain: blockchain.toUpperCase() as Blockchain,
      payload: signedAddMovementPayload.blockchain_raw.toLowerCase(),
      public_key: childKey.public_key,
      signature: signedAddMovementPayload.blockchain_data.userSig,
      type: CompletePayloadSignatureType.Movement,
      r: signedAddMovementPayload.blockchain_data.r
    })

    switch (blockchain) {
      case 'eth':
        const {
          address: scriptAddress,
          asset,
          amount: scriptAmount,
          nonce
        } = signedAddMovementPayload.blockchain_data
        const chainId = await this.web3.eth.net.getId()

        const scriptAmountDecimal = parseInt(scriptAmount, 10)
        const amountHex = scriptAmountDecimal.toString(16)

        let value: string = '0'

        if (
          quantity.currency === CryptoCurrency.ETH &&
          movementType === MovementTypeDeposit
        ) {
          value = this.web3.utils.toWei(quantity.amount)
        }

        const args = [
          '0x' + scriptAddress,
          '0x' + asset,
          '0x' + amountHex,
          '0x' + nonce,
          '0x' + scriptAddress,
          '0x' + blockchainSignature,
          '0x' + addMovementResult.data.addMovement.signature
        ]

        const invocation =
          movementType === MovementTypeDeposit
            ? this.ethVaultContract.methods.deposit(...args)
            : this.ethVaultContract.methods.sharedWithdrawal(...args)
        const abi = invocation.encodeABI()

        const ethAccountNonce = await this.web3.eth.getTransactionCount(
          '0x' + childKey.address
        )
        const gasPrice = await this.web3.eth.getGasPrice()
        const estimate = await this.web3.eth.estimateGas({
          from: '0x' + childKey.address,
          nonce: ethAccountNonce,
          gasPrice: '0x' + parseInt(gasPrice, 10).toString(16),
          value: '0x' + parseInt(value, 10).toString(16),
          to: this.opts.ethNetworkSettings.contracts.vault.contract,
          data: abi
        })

        this.validateTransactionCost(gasPrice, estimate)
        const movementTx = new EthTransaction({
          nonce: '0x' + ethAccountNonce.toString(16),
          gasPrice: '0x' + parseInt(gasPrice, 10).toString(16),
          gasLimit: '0x' + (estimate * 2).toString(16),
          to: this.opts.ethNetworkSettings.contracts.vault.contract,
          value: '0x' + parseInt(value, 10).toString(16),
          data: abi
        })
        movementTx.getChainId = () => chainId

        const invocationSignature = await this.signEthTransaction(movementTx)

        setSignature(movementTx, invocationSignature)

        const ethReceipt = await this.web3.eth.sendSignedTransaction(
          '0x' + movementTx.serialize().toString('hex')
        )
        return {
          txId: ethReceipt.transactionHash
        }
      case 'neo':
        const timestamp = new BigNumber(this.createTimestamp32()).toString(16)
        const nodes = this.opts.neoNetworkSettings.nodes.reverse()
        const node = await findBestNetworkNode(nodes)
        const rpcClient = new NeonJS.rpc.RPCClient(node)
        const balance = await NeonJS.api.neoscan.getBalance(
          this.opts.neoScan,
          childKey.address
        )
        const builder = new sc.ScriptBuilder()
        builder.emitAppCall(
          this.opts.neoNetworkSettings.contracts.vault.contract,
          movementType === MovementTypeDeposit ? 'deposit' : 'sharedWithdrawal',
          [
            new sc.ContractParam(
              'ByteArray',
              signedAddMovementPayload.blockchain_data.prefix
            ),
            new sc.ContractParam(
              'ByteArray',
              signedAddMovementPayload.blockchain_data.address
            ),
            new sc.ContractParam(
              'ByteArray',
              signedAddMovementPayload.blockchain_data.asset
            ),
            new sc.ContractParam(
              'ByteArray',
              signedAddMovementPayload.blockchain_data.amount
            ),
            new sc.ContractParam(
              'ByteArray',
              signedAddMovementPayload.blockchain_data.nonce
            ),
            new sc.ContractParam(
              'ByteArray',
              signedAddMovementPayload.blockchain_data.userPubKey
            ),
            new sc.ContractParam(
              'ByteArray',
              addMovementResult.data.addMovement.publicKey
            ),
            new sc.ContractParam('ByteArray', blockchainSignature),
            new sc.ContractParam(
              'ByteArray',
              addMovementResult.data.addMovement.signature
            )
          ]
        )
        let sendingFromSmartContract = false
        const transaction = new tx.InvocationTransaction({
          script: builder.str,
          gas: 0
        }).addAttribute(
          tx.TxAttrUsage.Script,
          u.reverseHex(wallet.getScriptHashFromAddress(childKey.address))
        )
        if (
          movementType === MovementTypeWithdrawal &&
          NEP5_OLD_ASSETS.includes(quantity.currency)
        ) {
          sendingFromSmartContract = true
          transaction.addAttribute(
            tx.TxAttrUsage.Script,
            u.reverseHex(
              this.opts.neoNetworkSettings!.contracts!.vault!.contract!
            )
          )
        }
        if (
          movementType === MovementTypeDeposit &&
          (quantity.currency === CryptoCurrency.NEO ||
            quantity.currency === CryptoCurrency.GAS)
        ) {
          transaction.addIntent(
            quantity.currency.toUpperCase(),
            new BigNumber(quantity.amount).toNumber(),
            this.opts.neoNetworkSettings.contracts.vault.address
          )
        }
        transaction
          .addAttribute(tx.TxAttrUsage.Remark, timestamp)
          .calculate(balance)
        const payload = transaction.serialize(false)

        const signature = await this.signNeoPayload(payload.toLowerCase())
        transaction.addWitness(
          tx.Witness.fromSignature(signature, childKey.public_key)
        )
        if (sendingFromSmartContract) {
          const acct = new wallet.Account(childKey.address)
          if (
            parseInt(
              this.opts.neoNetworkSettings.contracts!.vault!.contract!,
              16
            ) > parseInt(acct.scriptHash, 16)
          ) {
            transaction.scripts.push(
              new tx.Witness({
                invocationScript: '0000',
                verificationScript: ''
              })
            )
          } else {
            transaction.scripts.unshift(
              new tx.Witness({
                invocationScript: '0000',
                verificationScript: ''
              })
            )
          }
        }
        const signedNeoPayload = transaction.serialize(true)
        const neoStatus = await rpcClient.sendRawTransaction(signedNeoPayload)

        if (!neoStatus) {
          throw new Error('Could not send neo')
        }
        return {
          txId: transaction.hash
        }
      default:
        throw new Error('not implemented')
    }
    // console.log(blockchainSignature)
  }

  /**
   * Sign a withdraw request.
   *
   * @param address
   * @param quantity
   * @returns
   *
   * Example
   * ```typescript
   * import { createCurrencyAmount } from '@neon-exchange/api-client-ts'
   *
   * const address = 'd5480a0b20e2d056720709a9538b17119fbe9fd6';
   * const amount = createCurrencyAmount('1.5', CryptoCurrency.ETH);
   * const signedMovement = await nash.signWithdrawRequest(address, amount);
   * console.log(signedMovement)
   * ```
   */
  public async signWithdrawRequest(
    address: string,
    quantity: CurrencyAmount,
    nonce?: number
  ): Promise<SignMovementResult> {
    const signMovementParams = createAddMovementParams(
      address,
      quantity,
      MovementTypeWithdrawal,
      nonce
    )
    const signedPayload = await this.signPayload(signMovementParams)
    const result = await this.gql.mutate({
      mutation: ADD_MOVEMENT_MUTATION,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    })

    // after deposit or withdrawal we want to update nonces
    await this.updateTradedAssetNonces()

    return {
      result: result.data.addMovement,
      blockchain_data: signedPayload.blockchain_data
    }
  }

  /**
   * helper function that returns the correct types for the needed GQL queries
   * and mutations.
   *
   * @param [SigningPayloadID]
   * @param payload
   * @returns
   */
  private signPayload(
    payloadAndKind: PayloadAndKind
  ): Promise<{
    payload: Record<string, any>
    signature: {
      publicKey: string
      signedDigest: string
    }
    blockchain_data: {
      address: string
      amount: string
      asset: string
      nonce: string
      prefix: string
      r?: string
      userPubKey: string
      userSig?: string
    }
    blockchain_raw: string
    signedPayload: Record<string, any>
  }> {
    switch (this.mode) {
      case ClientMode.NONE:
        throw new Error('Not logged in')
      case ClientMode.FULL_SECRET:
        return this.signPayloadFull(payloadAndKind)
      case ClientMode.MPC:
        return this.signPayloadMpc(payloadAndKind)
    }
  }
  private async signPayloadMpc(
    payloadAndKind: PayloadAndKind
  ): Promise<{
    payload: Record<string, any>
    signature: {
      publicKey: string
      signedDigest: string
    }
    blockchain_data: {
      address: string
      amount: string
      asset: string
      nonce: string
      prefix: string
      r?: string
      userPubKey: string
      userSig?: string
    }
    blockchain_raw: string
    signedPayload: Record<string, any>
  }> {
    this.requireMPC()
    const signedPayload = await preSignPayload(this.apiKey, payloadAndKind, {
      fillPoolFn: this.fillPoolFn,
      assetData: this.assetData,
      marketData: this.nashProtocolMarketData
    })
    const out = {
      payload: payloadAndKind.payload,
      signature: {
        publicKey: this.apiKey.payload_public_key,
        signedDigest: signedPayload.signature
      },
      blockchain_data: signedPayload.blockchainMovement,
      blockchain_raw: signedPayload.blockchainRaw,
      signedPayload: signedPayload.payload
    }
    return out
  }
  private async signPayloadFull(
    payloadAndKind: PayloadAndKind
  ): Promise<{
    payload: Record<string, any>
    signature: {
      publicKey: string
      signedDigest: string
    }
    blockchain_data: {
      address: string
      amount: string
      asset: string
      nonce: string
      prefix: string
      r?: string
      userPubKey: string
      userSig?: string
    }
    blockchain_raw: string
    signedPayload: Record<string, any>
  }> {
    this.requireFull()
    const privateKey = Buffer.from(
      this.nashCoreConfig.payloadSigningKey.privateKey,
      'hex'
    )

    const signedPayload = signPayload(
      privateKey,
      payloadAndKind,
      this.nashCoreConfig
    )

    return {
      payload: payloadAndKind.payload,
      signature: {
        publicKey: this.publicKey,
        signedDigest: signedPayload.signature
      },
      blockchain_data: signedPayload.blockchainMovement,
      blockchain_raw: signedPayload.blockchainRaw,
      signedPayload: signedPayload.payload
    }
  }

  private fillPoolFn = async (arg: {
    client_dh_publics: string[]
    blockchain: Blockchain
  }): Promise<string[]> => {
    const result = await this.gql.mutate<DHFillPoolResp, DHFillPoolArgs>({
      mutation: DH_FIIL_POOL,
      variables: {
        dhPublics: arg.client_dh_publics,
        blockchain: arg.blockchain
      }
    })
    return result.data.dhFillPool
  }

  private async updateTradedAssetNonces(): Promise<void> {
    const nonces: AssetsNoncesData[] = await this.getAssetNonces(
      this.tradedAssets
    )
    const assetNonces = {}
    nonces.forEach(item => {
      assetNonces[item.asset] = item.nonces
    })
    this.assetNonces = assetNonces
  }

  private createTimestamp32(): number {
    return Math.trunc(new Date().getTime() / 10) - 155000000000
  }

  private getNoncesForTrade(
    marketName: string,
    direction: OrderBuyOrSell
  ): NonceSet {
    try {
      const pairs = marketName.split('_')
      const unitA = pairs[0]
      const unitB = pairs[1]
      this.currentOrderNonce = this.currentOrderNonce + 1

      let noncesTo = this.assetNonces[unitA]
      let noncesFrom = this.assetNonces[unitB]

      if (direction === OrderBuyOrSell.SELL) {
        noncesTo = this.assetNonces[unitB]
        noncesFrom = this.assetNonces[unitA]
      }

      return {
        noncesTo,
        noncesFrom,
        nonceOrder: this.currentOrderNonce
      }
    } catch (e) {
      console.info(`Could not get nonce set: ${e}`)
      return e
    }
  }

  private async fetchMarketData(): Promise<Record<string, Market>> {
    if (this.opts.debug) {
      console.log('fetching latest exchange market data')
    }
    const markets: Market[] = await this.listMarkets()
    const marketAssets: string[] = []
    if (markets) {
      const marketData: Record<string, Market> = {}
      let market: Market
      for (const it of Object.keys(markets)) {
        market = markets[it]
        marketData[market.name] = market
        if (!marketAssets.includes(market.aUnit)) {
          marketAssets.push(market.aUnit)
        }
        if (!marketAssets.includes(market.bUnit)) {
          marketAssets.push(market.bUnit)
        }
      }
      this.tradedAssets = marketAssets
      return marketData
    } else {
      throw new Error('Could not fetch markets')
    }
  }

  private async completeBtcTransactionSignatures(
    params: CompleteBtcTransactionSignaturesArgs
  ): Promise<string[]> {
    const resp = await this.gql.mutate<
      CompleteBtcTransactionSignaturesResult,
      CompleteBtcTransactionSignaturesArgs
    >({
      mutation: COMPLETE_BTC_TRANSACTION_SIGNATURES,
      variables: params
    })
    return resp.data.completeBtcPayloadSignature
  }

  private async sendBlockchainRawTransaction(params: {
    blockchain: SendBlockchainRawTransactionArgs['payload']['blockchain']
    payload: SendBlockchainRawTransactionArgs['payload']['transactionPayload']
  }): Promise<string> {
    const signedPayload = await this.signPayload(
      createSendBlockchainRawTransactionParams(
        params.blockchain,
        params.payload
      )
    )
    const resp = await this.gql.mutate<
      SendBlockchainRawTransactionResult,
      SendBlockchainRawTransactionArgs
    >({
      mutation: SEND_BLOCKCHAIN_RAW_TRANSACTION,
      variables: {
        payload: signedPayload.payload as SendBlockchainRawTransactionArgs['payload'],
        signature: signedPayload.signature
      }
    })
    return resp.data.sendBlockchainRawTransaction
  }

  private async completePayloadSignature(
    params: CompletePayloadSignatureArgs
  ): Promise<string> {
    const resp = await this.gql.mutate<
      { completePayloadSignature: CompletePayloadSignatureResult },
      CompletePayloadSignatureArgs
    >({
      mutation: COMPLETE_PAYLOAD_SIGNATURE,
      variables: params
    })
    return resp.data.completePayloadSignature.signature
  }

  private async fetchAssetData(): Promise<Record<string, AssetData>> {
    const assetList = {}
    const assets: Asset[] = await this.listAssets()
    for (const a of assets) {
      assetList[a.symbol] = {
        hash: a.hash,
        precision: 8,
        symbol: a.symbol,
        blockchainPrecision: a.blockchainPrecision,
        blockchain: a.blockchain
      }
    }
    return assetList
  }

  public getNeoAddress(): string {
    return this.apiKey.child_keys[BIP44.NEO].address
  }
  public getEthAddress(): string {
    return prefixWith0xIfNeeded(this.apiKey.child_keys[BIP44.ETH].address)
  }
  public getBtcAddress(): string {
    return this.apiKey.child_keys[BIP44.BTC].address
  }
}
