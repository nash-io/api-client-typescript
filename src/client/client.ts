import * as AbsintheSocket from '@absinthe/socket'
import { Socket as PhoenixSocket } from 'phoenix-channels'
import { print } from 'graphql/language/printer'
import fetch from 'node-fetch'
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
  PayloadAndKind,
  Blockchain,
  BIP44,
  preSignPayload,
  ChildKey,
  createAddMovementParams,
  createPlaceStopMarketOrderParams,
  createPlaceStopLimitOrderParams,
  createPlaceMarketOrderParams,
  createPlaceLimitOrderParams,
  createCancelOrderParams,
  createGetMovementParams,
  computePresig,
  createGetAssetsNoncesParams,
  createGetOrdersForMovementParams,
  createListMovementsParams,
  MovementTypeDeposit,
  MovementTypeWithdrawal,
  SyncState,
  APIKey,
  createSyncStatesParams,
  createSignStatesParams,
  createSendBlockchainRawTransactionParams,
  createTimestamp,
  SigningPayloadID
} from '@neon-exchange/nash-protocol-mpc'

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

export interface ClientOptions {
  host: string
  maxEthCostPrTransaction?: string
  debug?: boolean
  neoScan?: string
  neoNetworkSettings?: typeof NEO_NETWORK[Networks.MainNet]
  ethNetworkSettings?: typeof ETH_NETWORK[Networks.MainNet]
  btcNetworkSettings?: typeof BTC_NETWORK[Networks.MainNet]
}
export const EnvironmentConfiguration = {
  production: {
    host: 'app.nash.io',
    neoScan: 'https://neoscan.io//api/main_net',
    ethNetworkSettings: ETH_NETWORK[Networks.MainNet],
    neoNetworkSettings: NEO_NETWORK[Networks.MainNet],
    btcNetworkSettings: BTC_NETWORK[Networks.MainNet]
  } as ClientOptions,
  sandbox: {
    host: 'app.sandbox.nash.io',
    neoScan: 'https://explorer.neo.sandbox.nash.io/api/main_net',
    ethNetworkSettings: ETH_NETWORK[Networks.Sandbox],
    neoNetworkSettings: NEO_NETWORK[Networks.Sandbox],
    btcNetworkSettings: BTC_NETWORK[Networks.Sandbox]
  } as ClientOptions,
  dev1: {
    host: 'app.dev1.nash.io',
    neoScan: 'https://neo-local-explorer.dev1.nash.io/api/main_net',
    ethNetworkSettings: ETH_NETWORK[Networks.Dev1],
    neoNetworkSettings: NEO_NETWORK[Networks.Dev1],
    btcNetworkSettings: BTC_NETWORK[Networks.Dev1]
  } as ClientOptions,
  dev2: {
    host: 'app.dev2.nash.io',
    neoScan: 'https://neo-local-explorer.dev2.nash.io/api/main_net',
    ethNetworkSettings: ETH_NETWORK[Networks.Dev2],
    neoNetworkSettings: NEO_NETWORK[Networks.Dev2],
    btcNetworkSettings: BTC_NETWORK[Networks.Dev2]
  } as ClientOptions,
  dev3: {
    host: 'app.dev3.nash.io',
    neoScan: 'https://neo-local-explorer.dev3.nash.io/api/main_net',
    ethNetworkSettings: ETH_NETWORK[Networks.Dev3],
    neoNetworkSettings: NEO_NETWORK[Networks.Dev3],
    btcNetworkSettings: BTC_NETWORK[Networks.Dev3]
  } as ClientOptions,
  dev4: {
    host: 'app.dev4.nash.io',
    neoScan: 'https://neo-local-explorer.dev4.nash.io/api/main_net',
    ethNetworkSettings: ETH_NETWORK[Networks.Dev4],
    neoNetworkSettings: NEO_NETWORK[Networks.Dev4],
    btcNetworkSettings: BTC_NETWORK[Networks.Dev4]
  } as ClientOptions,
  local: { host: 'localhost:4000' } as ClientOptions
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const BLOCKCHAIN_TO_BIP44 = {
  [Blockchain.ETH]: BIP44.ETH,
  [Blockchain.BTC]: BIP44.BTC,
  [Blockchain.NEO]: BIP44.NEO
}

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
  public ethVaultContract: Contract
  public apiKey: APIKey
  private maxEthCostPrTransaction: BigNumber
  private opts: ClientOptions
  private apiUri: string

  private wsToken: string
  private wsUri: string
  private isMainNet: boolean
  private gql: GQL
  private web3: Web3
  private authorization: string
  public marketData: { [key: string]: Market }
  public nashProtocolMarketData: ReturnType<typeof mapMarketsForNashProtocol>
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
  constructor(opts: ClientOptions) {
    this.opts = {
      maxEthCostPrTransaction: '0.01',
      ...opts
    }
    this.isMainNet = this.opts.host === EnvironmentConfiguration.production.host
    this.web3 = new Web3(this.opts.ethNetworkSettings.nodes[0])

    if (!opts.host || opts.host.indexOf('.') === -1) {
      throw new Error(`Invalid API host '${opts.host}'`)
    }

    this.apiUri = `https://${opts.host}/api/graphql`
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
    const query: GQL['query'] = async params => {
      const resp = await fetch(this.apiUri, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.authorization
        },
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
      const obj = await resp.json()
      if (obj.errors) {
        throw new ApolloError({
          graphQLErrors: obj.errors
        })
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
   * await nash.login({ email, password })
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
    const updatedAccountOrdersString = print(UPDATED_ACCOUNT_ORDERS)
    const updateOrderBookString = print(UPDATED_ORDER_BOOK)
    const newAccountTradesString = print(NEW_ACCOUNT_TRADES)
    const newTradesString = print(NEW_TRADES)
    const updatedTickersString = print(UPDATED_TICKERS)
    const updatedCandlesString = print(UPDATED_CANDLES)
    return {
      socket,
      onUpdatedAccountOrders: async (payload, handlers) => {
        authCheck('onUpdatedAccountOrders')
        AbsintheSocket.observe(
          absintheSocket,
          AbsintheSocket.send(absintheSocket, {
            operation: updatedAccountOrdersString,
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
            operation: updatedCandlesString,
            variables
          }),
          handlers
        ),
      onUpdatedTickers: handlers => {
        AbsintheSocket.observe(
          absintheSocket,
          AbsintheSocket.send(absintheSocket, {
            operation: updatedTickersString,
            variables: {}
          }),
          handlers
        )
      },
      onNewTrades: (variables, handlers) => {
        AbsintheSocket.observe(
          absintheSocket,
          AbsintheSocket.send(absintheSocket, {
            operation: newTradesString,
            variables
          }),
          handlers
        )
      },
      onUpdatedOrderbook: (variables, handlers) => {
        AbsintheSocket.observe(
          absintheSocket,
          AbsintheSocket.send(absintheSocket, {
            operation: updateOrderBookString,
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
            operation: newAccountTradesString,
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
   * Login against the central account service. A login is required for all signed
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
    this.authorization = `Token ${apiKey}`
    this.wsToken = apiKey
    this.apiKey = JSON.parse(Buffer.from(secret, 'base64').toString('utf-8'))
    this.marketData = await this.fetchMarketData()
    this.nashProtocolMarketData = mapMarketsForNashProtocol(this.marketData)
    this.assetData = await this.fetchAssetData()

    this.currentOrderNonce = this.createTimestamp32()
    await this.updateTradedAssetNonces()
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
        const transaction = new tx.InvocationTransaction({
          script: builder.str,
          gas: 0
        })
          .addAttribute(
            tx.TxAttrUsage.Script,
            u.reverseHex(wallet.getScriptHashFromAddress(childKey.address))
          )
          .addAttribute(tx.TxAttrUsage.Remark, timestamp)
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
        transaction.calculate(balance)
        const payload = transaction.serialize(false)

        const signature = await this.signNeoPayload(payload.toLowerCase())
        transaction.addWitness(
          tx.Witness.fromSignature(signature, childKey.public_key)
        )
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
  private async signPayload(
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
