import * as AbsintheSocket from '@absinthe/socket'
import { Socket as PhoenixSocket } from 'phoenix-channels'
import { print } from 'graphql/language/printer'
import { LIST_MARKETS_QUERY } from '../queries/market/listMarkets'
import { GET_MARKET_QUERY } from '../queries/market/getMarket'
import { LIST_ACCOUNT_TRANSACTIONS } from '../queries/account/listAccountTransactions'
import {
  LIST_ACCOUNT_ORDERS,
  LIST_ACCOUNT_ORDERS_WITH_TRADES
} from '../queries/order/listAccountOrders'
import { LIST_ACCOUNT_TRADES } from '../queries/trade/listAccountTrades'
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
import { GET_DEPOSIT_ADDRESS } from '../queries/getDepositAddress'
import { GET_ACCOUNT_PORTFOLIO } from '../queries/account/getAccountPortfolio'
import { LIST_ACCOUNT_VOLUMES } from '../queries/account/listAccountVolumes'
import { LIST_ASSETS_QUERY } from '../queries/asset/listAsset'

import { NEW_ACCOUNT_TRADES } from '../subscriptions/newAccountTrades'
import { UPDATED_ACCOUNT_ORDERS } from '../subscriptions/updatedAccountOrders'
import { UPDATED_ORDER_BOOK } from '../subscriptions/updatedOrderBook'
import { NEW_TRADES } from '../subscriptions/newTrades'
import { UPDATED_TICKERS } from '../subscriptions/updatedTickers'
import { UPDATED_CANDLES } from '../subscriptions/updatedCandles'

import {
  GetAssetsNoncesData,
  GET_ASSETS_NONCES_QUERY,
  AssetsNoncesData
} from '../queries/nonces'
import {
  GET_ORDERS_FOR_MOVEMENT_QUERY,
  OrdersForMovementData
} from '../queries/movement/getOrdersForMovementQuery'
import {
  USER_2FA_LOGIN_MUTATION,
  TwoFactorLoginResponse
} from '../mutations/account/twoFactorLoginMutation'
import { checkMandatoryParams, formatPayload } from './utils'
import { Result } from '../types'
import {
  GetStatesData,
  SignStatesData,
  SIGN_STATES_MUTATION,
  SYNC_STATES_MUTATION
} from '../mutations/stateSyncing'
import { SALT } from '../config'
import { FiatCurrency } from '../constants/currency'
import {
  normalizePriceForMarket,
  normalizeAmountForMarket,
  mapMarketsForNashProtocol
} from '../helpers'
import toHex from 'array-buffer-to-hex'
import fetch from 'node-fetch'
import {
  OrderBook,
  TradeHistory,
  Ticker,
  Trade,
  CandleRange,
  CandleInterval,
  AccountDepositAddress,
  Movement,
  MovementStatus,
  MovementType,
  AccountPortfolio,
  AccountVolume,
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
  AssetData,
  Asset,
  MissingNonceError,
  InsufficientFundsError
} from '../types'

import { CryptoCurrency } from '../constants/currency'

import {
  getSecretKey,
  encryptSecretKey,
  PayloadAndKind,
  getHKDFKeysFromPassword,
  initialize,
  InitParams,
  Config,
  signPayload,
  createAddMovementParams,
  createPlaceStopMarketOrderParams,
  createPlaceStopLimitOrderParams,
  createPlaceMarketOrderParams,
  createPlaceLimitOrderParams,
  createCancelOrderParams,
  createGetMovementParams,
  createGetDepositAddressParams,
  createGetAccountOrderParams,
  createGetAccountBalanceParams,
  createGetAccountVolumesParams,
  createGetAssetsNoncesParams,
  createGetOrdersForMovementParams,
  createAccountPortfolioParams,
  createListMovementsParams,
  createListAccountBalanceParams,
  createListAccountTransactionsParams,
  createListAccountOrdersParams,
  createListAccountTradesParams,
  MovementTypeDeposit,
  MovementTypeWithdrawal,
  SyncState,
  createSyncStatesParams,
  bufferize,
  createSignStatesParams,
  createTimestamp,
  SigningPayloadID
} from '@neon-exchange/nash-protocol'

import {
  States,
  SignStatesFields
} from 'mutations/stateSyncing/fragments/signStatesFragment'


const environmentConfiguration = {
  production: { host: 'app.nash.io' },
  sandbox: { host: 'app.sandbox.nash.io' },
  dev1: { host: 'app.dev1.nash.io' },
  dev2: { host: 'app.dev2.nash.io' },
  dev3: { host: 'app.dev3.nash.io' },
  dev4: { host: 'app.dev4.nash.io' }
}

/**
 * ClientOptions is used to configure and construct a new Nash API Client.
 */
export interface ClientOptions {
  env: keyof(typeof environmentConfiguration)
  debug?: boolean
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

interface LoginParams {
  email: string
  password: string
  twoFaCode?: string
  walletIndices: { [key: string]: number }
  presetWallets?: object
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
interface GQLQueryParams {
  query: any
  variables?: object
}
interface GQLMutationParams {
  mutation: any
  variables?: object
}

interface GQLError {
  message: string
}

interface GQLResp<T> {
  data: T
  errors?: GQLError[]
}

interface GQL {
  query<T = any>(params: GQLQueryParams): Promise<GQLResp<T>>
  mutate<T = any>(params: GQLMutationParams): Promise<GQLResp<T>>
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

export const MISSING_NONCES = 'missing_asset_nonces'
export const MAX_SIGN_STATE_RECURSION = 5

interface SubscriptionHandlers<T> {
  onResult: (p: T) => void
  onError: (p: Error) => void
  onAbort: (p: Error) => void
  onStart: (p: object) => void
}

interface NashSocketEvents {
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

export class Client {
  private opts: ClientOptions
  private apiUri: string
  private casUri: string
  private wsUri: string

  private initParams: InitParams
  private nashCoreConfig: Config
  private casCookie: string
  private account: any
  private publicKey: string
  private gql: GQL
  private walletIndices: { [key: string]: number }
  public marketData: { [key: string]: Market }
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
   * import { Client } from '@neon-exchange/api-client-typescript'
   *
   * const nash = new Client({
   *   env: 'production',
   *   debug: true
   * })
   * ```
   */
  constructor(opts: ClientOptions) {
    this.opts = opts

    const host = environmentConfiguration[opts.env].host
    if (!host) {
      throw new Error(`Invalid env '${opts.env}'`);
    }

    this.apiUri = process.env.API_URI || `https://${host}/api/graphql`
    this.casUri = process.env.CAS_URI || `https://${host}/api`
    this.wsUri = process.env.WS_URI || `wss://${host}/api/socket`

    const query: GQL['query'] = async params => {
      // const operation = params.query.definitions[0]
      // const operationName = operation && (operation.name.value as string)
      const resp = await fetch(this.apiUri, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: this.casCookie
        },
        body: JSON.stringify({
          query: memorizedPrint(params.query),
          variables: params.variables
        })
      })
      if (resp.status !== 200) {
        let msg = `API error. Status code: ${resp.status}`
        if (resp.data) { msg += ` / body: ${resp.data}`}
        throw new Error(msg)
      }
      const obj = await resp.json()
      if (obj.errors) {
        throw new Error(JSON.stringify(obj.errors, null, 2))
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
   * import { Client } from '@neon-exchange/api-client-typescript'
   *
   * const nash = new Client({
   *   env: 'production',
   *   debug: true
   * })
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
    const m = /nash-cookie=([0-9a-z-]+)/.exec(this.casCookie)
    if (m == null) {
      throw new Error('To subscribe to events, please login() first')
    }
    if (this.wsUri == null) {
      throw new Error('wsUri config parameter missing')
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
      params: {
        token: m[1]
      }
    })

    const absintheSocket = AbsintheSocket.create(socket)
    const updatedAccountOrdersString = print(UPDATED_ACCOUNT_ORDERS)
    const updateOrderBookString = print(UPDATED_ORDER_BOOK)
    const newAccountTradesString = print(NEW_ACCOUNT_TRADES)
    const newTradesString = print(NEW_TRADES)
    const updatedTickersString = print(UPDATED_TICKERS)
    const updatedCandlesString = print(UPDATED_CANDLES)
    return {
      onUpdatedAccountOrders: async (variables, handlers) => {
        const signedPayload = await this.signPayload({
          kind: SigningPayloadID.updatedAccountOrders,
          payload: {
            ...variables,
            timestamp: createTimestamp()
          }
        })
        const not = AbsintheSocket.send(absintheSocket, {
          operation: updatedAccountOrdersString,
          variables: signedPayload
        })
        AbsintheSocket.observe(absintheSocket, not, handlers)
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
      onAccountTrade: async (variables, handlers) => {
        const signedPayload = await this.signPayload({
          kind: SigningPayloadID.newAccountTrades,
          payload: {
            ...variables,
            timestamp: createTimestamp()
          }
        })

        AbsintheSocket.observe(
          absintheSocket,
          AbsintheSocket.send(absintheSocket, {
            operation: newAccountTradesString,
            variables: signedPayload
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
   * @param email
   * @param password
   * @param twoFaCode (optional)
   * @returns
   *
   * Example
   * ```
   * const email = 'user@nash.io`
   * const password = `yourpassword`
   *
   * nash.login({
   *   email,
   *   password
   * })
   * .then(_ => console.log('login success'))
   * .catch(e => console.log(`login failed ${e}`)
   * ```
   */
  public async login({
    email,
    password,
    twoFaCode,
    walletIndices = { neo: 1, eth: 1 },
    presetWallets
  }: LoginParams): Promise<Result<boolean>> {
    // const validParams = checkMandatoryParams(
    //      )
    // if (validParams.type === 'error') {
    //   return validParams
    // }
    const validParams = checkMandatoryParams({
      email,
      password,
      Type: 'string'
    })
    if (validParams.type === 'error') {
      return validParams
    }
    this.walletIndices = walletIndices
    const keys = await getHKDFKeysFromPassword(password, SALT)
    const loginUrl = this.casUri + '/user_login'
    const body = {
      email,
      password: toHex(keys.authKey)
    }

    const response = await fetch(loginUrl, {
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST'
    })

    if (response.status !== 200) {
      let msg = `Login error. API status code: ${response.status}`
      if (response.data) { msg += ` / body: ${response.data}`}
      throw new Error(msg)
    }

    this.casCookie = response.headers.get('set-cookie')
    const result = await response.json()
    if (result.error || result.message === 'Two factor required') {
      return {
        type: 'error',
        message: result.message
      }
    }

    this.account = result.account
    const marketPayload = await this.fetchMarketData()
    if (marketPayload.type === 'error') {
      return marketPayload
    }
    this.marketData = marketPayload.data
    const assetPayload = await this.fetchAssetData()
    if (assetPayload.type === 'error') {
      return assetPayload
    }
    this.assetData = assetPayload.data
    this.assetNonces = {}
    this.currentOrderNonce = this.createTimestamp32()

    if (twoFaCode !== undefined) {
      this.account = await this.doTwoFactorLogin(twoFaCode)
      if (this.account.type === 'error') {
        return this.account
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
      return { type: 'ok' }
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

    return { type: 'ok' }
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
      twoFAaccount.wallets.forEach(wallet => {
        wallets[wallet.blockchain.toLowerCase()] = wallet.chainIndex
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
  public async getTicker(marketName: string): Promise<Result<Ticker>> {
    const validParams = checkMandatoryParams({ marketName, Type: 'string' })
    if (validParams.type === 'error') {
      return validParams
    }

    const result = await this.gql.query<{ getTicker: Ticker }>({
      query: GET_TICKER,
      variables: { marketName }
    })
    const payload = formatPayload('getTicker', result)
    return payload
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
  public async getOrderBook(marketName: string): Promise<Result<OrderBook>> {
    const validParams = checkMandatoryParams({ marketName, Type: 'string' })
    if (validParams.type === 'error') {
      return validParams
    }
    const result = await this.gql.query<{ getOrderBook: OrderBook }>({
      query: GET_ORDERBOOK,
      variables: { marketName }
    })
    const payload = formatPayload('getOrderBook', result)
    return payload
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
  }: ListTradeParams): Promise<Result<TradeHistory>> {
    const validParams = checkMandatoryParams({ marketName, Type: 'string' })
    if (validParams.type === 'error') {
      return validParams
    }
    const result = await this.gql.query<{ listTrades: TradeHistory }>({
      query: LIST_TRADES,
      variables: { marketName, limit, before }
    })
    return formatPayload('listTrades', result)
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
  public async listTickers(): Promise<Result<Ticker[]>> {
    const result = await this.gql.query<{ listTickers: Ticker[] }>({
      query: LIST_TICKERS
    })
    return formatPayload('listTickers', result)
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
  public async listAssets(): Promise<Result<Asset[]>> {
    const result = await this.gql.query<{ listAssets: Asset[] }>({
      query: LIST_ASSETS_QUERY
    })
    return formatPayload('listAssets', result)
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
  }: ListCandlesParams): Promise<Result<CandleRange>> {
    const validParams = checkMandatoryParams({ marketName, Type: 'string' })
    if (validParams.type === 'error') {
      return validParams
    }
    const result = await this.gql.query<{ listCandles: CandleRange }>({
      query: LIST_CANDLES,
      variables: { marketName, before, interval, limit }
    })
    return formatPayload('listCandles', result)
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
  public async listMarkets(): Promise<Result<Market[]>> {
    const result = await this.gql.query<{ listMarkets: Market[] }>({
      query: LIST_MARKETS_QUERY
    })
    return formatPayload('listMarkets', result)
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

  public async getMarket(marketName: string): Promise<Result<Market>> {
    const validParams = checkMandatoryParams({ marketName, Type: 'string' })
    if (validParams.type === 'error') {
      return validParams
    }
    const result = await this.gql.query<{ getMarkets: Market }>({
      query: GET_MARKET_QUERY,
      variables: { marketName }
    })
    return formatPayload('getMarkets', result)
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
  }: ListAccountOrderParams = {}): Promise<Result<AccountOrder>> {
    const listAccountOrdersParams = createListAccountOrdersParams(
      before,
      buyOrSell,
      limit,
      marketName,
      rangeStart,
      rangeStop,
      status,
      type
    )
    const query = shouldIncludeTrades
      ? LIST_ACCOUNT_ORDERS_WITH_TRADES
      : LIST_ACCOUNT_ORDERS

    const signedPayload = await this.signPayload(listAccountOrdersParams)
    const result = await this.gql.query<{ listAccountOrders: AccountOrder }>({
      query,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    })
    return formatPayload('listAccountOrders', result)
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
  }: ListAccountTradeParams = {}): Promise<Result<TradeHistory>> {
    const listAccountTradeParams = createListAccountTradesParams(
      before,
      limit,
      marketName
    )
    const signedPayload = await this.signPayload(listAccountTradeParams)
    const result = await this.gql.query<{ listAccountTrades: TradeHistory }>({
      query: LIST_ACCOUNT_TRADES,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    })
    return formatPayload('listAccountTrades', result)
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
  // should change the parameter
  // should declare de variables based on params
  public async listAccountTransactions({
    cursor,
    fiatSymbol,
    limit
  }: ListAccountTransactionsParams): Promise<Result<AccountTransaction>> {
    const listAccountTransactionsParams = createListAccountTransactionsParams(
      cursor,
      fiatSymbol,
      limit
    )
    const signedPayload = await this.signPayload(listAccountTransactionsParams)

    const result = await this.gql.query<{
      listAccountTransactions: AccountTransaction
    }>({
      query: LIST_ACCOUNT_TRANSACTIONS,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    })
    return formatPayload('listAccountTransactions', result)
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
  ): Promise<Result<AccountBalance[]>> {
    const validParams = checkMandatoryParams({
      ignoreLowBalance,
      Type: 'boolean'
    })
    if (validParams.type === 'error') {
      return validParams
    }
    const listAccountBalanceParams = createListAccountBalanceParams(
      ignoreLowBalance
    )
    const signedPayload = await this.signPayload(listAccountBalanceParams)
    const result = await this.gql.query<{
      listAccountBalances: AccountBalance[]
    }>({
      query: LIST_ACCOUNT_BALANCES,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    })
    return formatPayload('listAccountBalances', result)
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
   * const address = await nash.getDepositAddress(CryptoCurrency.NEO)
   * console.log(address)
   * ```
   */
  public async getDepositAddress(
    currency: CryptoCurrency
  ): Promise<Result<AccountDepositAddress>> {
    const validParams = checkMandatoryParams({ currency, Type: 'string' })
    if (validParams.type === 'error') {
      return validParams
    }
    const getDepositAddressParams = createGetDepositAddressParams(currency)
    const signedPayload = await this.signPayload(getDepositAddressParams)

    const result = await this.gql.query<{
      getDepositAddress: AccountDepositAddress
    }>({
      query: GET_DEPOSIT_ADDRESS,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    })
    return formatPayload('getDepositAddress', result)
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
   * const accountPortfolio = await nash.getAccountPortfolio()
   * console.log(accountPortfolio)
   * ```
   */

  public async getAccountPortfolio({
    fiatSymbol,
    period
  }: GetAccountPortfolioParams = {}): Promise<Result<AccountPortfolio>> {
    const validParams = checkMandatoryParams({
      fiatSymbol,
      period,
      Type: 'string'
    })
    if (validParams.type === 'error') {
      return validParams
    }

    const getAccountPortfolioParams = createAccountPortfolioParams(
      fiatSymbol,
      period
    )
    const signedPayload = await this.signPayload(getAccountPortfolioParams)

    const result = await this.gql.query<{
      getAccountPorfolio: AccountPortfolio
    }>({
      query: GET_ACCOUNT_PORTFOLIO,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    })
    return formatPayload('getAccountPorfolio', result)
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
  public async getMovement(movementID: number): Promise<Result<Movement>> {
    const validParams = checkMandatoryParams({ movementID, Type: 'number' })
    if (validParams.type === 'error') {
      return validParams
    }
    const getMovemementParams = createGetMovementParams(movementID)
    const signedPayload = await this.signPayload(getMovemementParams)

    const result = await this.gql.query<{ getMovement: Movement }>({
      query: GET_MOVEMENT,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    })
    return formatPayload('getMovement', result)
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
  ): Promise<Result<AccountBalance>> {
    const validParams = checkMandatoryParams({ currency, Type: 'string' })
    if (validParams.type === 'error') {
      return validParams
    }
    const getAccountBalanceParams = createGetAccountBalanceParams(currency)
    const signedPayload = await this.signPayload(getAccountBalanceParams)

    const result = await this.gql.query<{ getAccountBalance: AccountBalance }>({
      query: GET_ACCOUNT_BALANCE,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    })
    return formatPayload('getAccountBalance', result)
  }

  /**
   * Get an order by ID.
   *
   * @param orderID
   * @returns
   *
   * Example
   * ```
   * const order = await nash.getAccountOrder('999')
   * console.log(order)
   * ```
   */
  public async getAccountOrder(orderID: string): Promise<Result<Order>> {
    const validParams = checkMandatoryParams({ orderID, Type: 'string' })
    if (validParams.type === 'error') {
      return validParams
    }
    const getAccountOrderParams = createGetAccountOrderParams(orderID)
    const signedPayload = await this.signPayload(getAccountOrderParams)

    const result = await this.gql.query<{ getAccountOrder: Order }>({
      query: GET_ACCOUNT_ORDER,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    })
    return formatPayload('getAccountOrder', result)
  }

  /**
   * List all volumes for the current authenticated account.
   *
   * @returns
   *
   * Example
   * ```
   * const accountVolume = await nash.listAccountVolumes()
   * console.log(accountVolume.thirtyDayTotalVolumePercent)
   * ```
   */
  public async listAccountVolumes(): Promise<Result<AccountVolume>> {
    const listAccountVolumesParams = createGetAccountVolumesParams()
    const signedPayload = await this.signPayload(listAccountVolumesParams)

    const result = await this.gql.query<{ listAccountVolumes: AccountVolume }>({
      query: LIST_ACCOUNT_VOLUMES,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    })
    return formatPayload('listAccountVolumes', result)
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
  }: ListMovementsParams): Promise<Result<Movement[]>> {
    const listMovementParams = createListMovementsParams(currency, status, type)
    const signedPayload = await this.signPayload(listMovementParams)

    const result = await this.gql.query<{ listMovements: Movement[] }>({
      query: LIST_MOVEMENTS,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    })
    return formatPayload('listMovements', result)
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
  ): Promise<Result<OrdersForMovementData>> {
    const validParams = checkMandatoryParams({ asset, Type: 'string' })
    if (validParams.type === 'error') {
      return validParams
    }
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

    return formatPayload('getOrdersForMovement', result)
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
  ): Promise<Result<AssetsNoncesData[]>> {
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
    return formatPayload('getAssetsNonces', result)
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
  public async getSignAndSyncStates(): Promise<Result<SyncState[]>> {
    try {
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
    } catch (error) {
      return {
        type: 'error',
        message: `Could not get/sign/sync states: ${error}`
      }
    }
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
  ): Promise<Result<SyncState[]>> {
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

    try {
      const result = await this.gql.mutate<{ syncStates: SyncState[] }>({
        mutation: SYNC_STATES_MUTATION,
        variables: {
          payload: signedPayload.payload,
          signature: signedPayload.signature
        }
      })
      // after syncing states, we should always update asset nonces
      await this.updateTradedAssetNonces()

      return formatPayload('syncStates', result)
    } catch (e) {
      return {
        type: 'error',
        message: 'Could not query graphql for sync states'
      }
    }
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
  public async cancelAllOrders(marketName?: string): Promise<Result<boolean>> {
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
   *   OrdeCancellationPolicy.GOOD_TILL_CANCELLED,
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
  ): Promise<Result<OrderPlaced>> {
    const validParams = checkMandatoryParams(
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
    if (validParams.type === 'error') {
      return validParams
    }
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
      return formatPayload('placeLimitOrder', result)
    } catch (e) {
      if (e.message.includes(MISSING_NONCES)) {
        const updateNoncesOk = await this.updateTradedAssetNonces()
        if (updateNoncesOk.type === 'ok') {
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
  ): Promise<Result<OrderPlaced>> {
    const validParams = checkMandatoryParams({
      buyOrSell,
      marketName,
      Type: 'string'
    })
    if (validParams.type === 'error') {
      return validParams
    }
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
      return formatPayload('placeMarketOrder', result)
    } catch (e) {
      if (e.message.includes(MISSING_NONCES)) {
        const updateNoncesOk = await this.updateTradedAssetNonces()
        if (updateNoncesOk.type === 'ok') {
          return await this.placeMarketOrder(amount, buyOrSell, marketName)
        }
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
   *   OrdeCancellationPolicy.GOOD_TILL_CANCELLED,
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
  ): Promise<Result<OrderPlaced>> {
    const validParams = checkMandatoryParams(
      { allowTaker, Type: 'boolean' },
      { buyOrSell, marketName, cancellationPolicy, Type: 'string' },
      { cancelAt: 'number' }
    )
    if (validParams.type === 'error') {
      return validParams
    }
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

      return formatPayload('placeStopLimitOrder', result)
    } catch (e) {
      if (e.message.includes(MISSING_NONCES)) {
        const updateNoncesOk = await this.updateTradedAssetNonces()
        if (updateNoncesOk) {
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
  ): Promise<Result<OrderPlaced>> {
    const validParams = checkMandatoryParams(
      { amount, stopPrice, Type: 'object' },
      { buyOrSell, marketName, Type: 'string' }
    )
    if (validParams.type === 'error') {
      return validParams
    }

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
      return formatPayload('placeStopMarketOrder', result)
    } catch (e) {
      if (e.message.includes(MISSING_NONCES)) {
        const updateNoncesOk = await this.updateTradedAssetNonces()
        if (updateNoncesOk) {
          return await this.placeStopMarketOrder(
            amount,
            buyOrSell,
            marketName,
            stopPrice
          )
        }
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
   * creates and uploads wallet and encryption keys to the CAS.
   *
   * expects something like the following
   * {
   *   "signature_public_key": "024b14170f0166ff85882356295f5aa0cf4a9a5d29725b5a9e410ec193d20ee98f",
   *   "encrypted_secret_key": "eb13bb0e89102d64700906c7082f9472",
   *   "encrypted_secret_key_nonce": "f6783fe349320f71acc2ca79",
   *   "encrypted_secret_key_tag": "7c8dc1020de77cd42dbbbb850f4335e8",
   *   "wallets": [
   *     {
   *       "blockchain": "neo",
   *       "address": "Aet6eGnQMvZ2xozG3A3SvWrMFdWMvZj1cU",
   *       "public_key": "039fcee26c1f54024d19c0affcf6be8187467c9ba4749106a4b897a08b9e8fed23"
   *     },
   *     {
   *       "blockchain": "ethereum",
   *       "address": "5f8b6d9d487c8136cc1ad87d6e176742af625de8",
   *       "public_key": "04d37f1a8612353ffbf20b0a68263b7aae235bd3af8d60877ed8135c27630d895894885f220a39acab4e70b025b1aca95fab1cd9368bf3dc912ef32dc65aecfa02"
   *     }
   *   ]
   * }
   */
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
   * helper function that returns the correct types for the needed GQL queries
   * and mutations.
   *
   * @param [SigningPayloadID]
   * @param payload
   * @returns
   */
  private async signPayload(payloadAndKind: PayloadAndKind): Promise<any> {
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

  private async updateTradedAssetNonces(): Promise<Result<boolean>> {
    try {
      const payload: Result<AssetsNoncesData[]> = await this.getAssetNonces(
        this.tradedAssets
      )
      if (payload.type === 'error') {
        return {
          type: 'error',
          message: 'failed to retrieve nonces data'
        }
      }
      const nonces: AssetsNoncesData[] = payload.data
      const assetNonces = {}
      nonces.forEach(item => {
        assetNonces[item.asset] = item.nonces
      })
      this.assetNonces = assetNonces
      return { type: 'ok' }
    } catch (e) {
      return {
        type: 'error',
        message: `Could not update traded asset nonces: ${JSON.stringify(e)}`
      }
    }
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

  private async fetchMarketData(): Promise<Result<Record<string, Market>>> {
    if (this.opts.debug) {
      console.log('fetching latest exchange market data')
    }
    const payload: Result<Market[]> = await this.listMarkets()
    if (payload.type === 'error') {
      return payload
    }
    const markets = payload.data
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
      return {
        type: 'ok',
        data: marketData
      }
    } else {
      return {
        type: 'error',
        message: 'fail to retrieve market assets data'
      }
    }
  }

  private async fetchAssetData(): Promise<Result<Record<string, AssetData>>> {
    const assetList = {}
    try {
      const payload: Result<Asset[]> = await this.listAssets()
      if (payload.type === 'error') {
        return payload
      }
      const assets = payload.data
      for (const a of assets) {
        assetList[a.symbol] = {
          hash: a.hash,
          precision: 8,
          blockchain: a.blockchain
        }
      }
    } catch (e) {
      console.log('Could not get assets: ', e)
      return {
        type: 'error',
        message: 'Could not get assets'
      }
    }
    return {
      type: 'ok',
      data: assetList
    }
  }
}
