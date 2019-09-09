import { ApolloClient } from 'apollo-client'
import { setContext } from 'apollo-link-context'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { createHttpLink } from 'apollo-link-http'
import { LIST_MARKETS_QUERY } from '../queries/market/listMarkets'
import { GET_MARKET_QUERY } from '../queries/market/getMarket'
import { LIST_ACCOUNT_TRANSACTIONS } from '../queries/account/listAccountTransactions'
import { LIST_ACCOUNT_ORDERS } from '../queries/order/listAccountOrders'
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
import { GetAssetsNoncesData, GET_ASSETS_NONCES_QUERY } from '../queries/nonces'
import {
  GET_ORDERS_FOR_MOVEMENT_QUERY,
  GetOrdersForMovementData
} from '../queries/movement/getOrdersForMovementQuery'
import {
  USER_2FA_LOGIN_MUTATION,
  TwoFactorLoginResponse
} from '../mutations/account/twoFactorLoginMutation'

import {
  GetStatesData,
  GET_STATES_MUTATION,
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
  MovementTypeDeposit,
  MovementTypeWithdrawal,
  createGetStatesParams,
  SyncState,
  createSyncStatesParams,
  bufferize,
  createSignStatesParams,
  createTimestamp,
  SigningPayloadID
} from '@neon-exchange/nash-protocol'

/**
 * ClientOptions is used to configure and construct a new Nash API Client.
 */
export interface ClientOptions {
  apiURI: string
  casURI: string
  debug?: boolean
}

export interface NonceSet {
  noncesFrom: number[]
  noncesTo: number[]
  nonceOrder: number
}

export class Client {
  private opts: ClientOptions
  private initParams: InitParams
  private nashCoreConfig: Config
  private casCookie: string
  private account: any
  private publicKey: string
  private gql: ApolloClient<any>
  private walletIndices: { [key: string]: number }
  public marketData: { [key: string]: Market }
  public assetData: { [key: string]: AssetData }

  private tradedAssets: string[] = []
  private assetNonces: { [key: string]: number[] }
  private noncesDirty: boolean = true

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
   *   apiURI: 'https://pathtoapiurl',
   *   casURI: 'https://pathtocasurl',
   *   debug: true
   * })
   * ```
   */
  constructor(opts: ClientOptions) {
    this.opts = opts

    const headerLink = setContext((_, { headers }) => {
      return {
        headers: {
          ...headers,
          Cookie: this.casCookie
        }
      }
    })

    const httpLink = createHttpLink({ fetch, uri: this.opts.apiURI })

    this.gql = new ApolloClient({
      cache: new InMemoryCache(),
      link: headerLink.concat(httpLink),
      defaultOptions: {
        watchQuery: {
          fetchPolicy: 'no-cache',
          errorPolicy: 'all'
        },
        query: {
          fetchPolicy: 'no-cache',
          errorPolicy: 'all'
        }
      }
    })
  }

  /**
   * Login against the central account service. A login is required for all signed
   * request.
   *
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
   * nash.login(email, password)
   * .then(_ => console.log('login success'))
   * .catch(e => console.log(`login failed ${e}`)
   * ```
   */
  public async login(
    email: string,
    password: string,
    twoFaCode?: string,
    walletIndices: { [key: string]: number } = { neo: 1, eth: 1 },
    presetWallets?: object
  ): Promise<boolean> {
    this.walletIndices = walletIndices
    const keys = await getHKDFKeysFromPassword(password, SALT)
    const loginUrl = this.opts.casURI + '/user_login'
    const body = {
      email,
      password: toHex(keys.authKey)
    }
    const response = await fetch(loginUrl, {
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST'
    })

    this.casCookie = response.headers.get('set-cookie')
    const result = await response.json()
    if (result.error) {
      throw new Error(result.message)
    }

    this.account = result.account

    this.marketData = await this.fetchMarketData()
    this.assetData = await this.fetchAssetData()

    if (twoFaCode !== undefined) {
      this.account = await this.doTwoFactorLogin(twoFaCode)
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

      return true
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

    return true
  }

  private async doTwoFactorLogin(twoFaCode: string): Promise<any> {
    const twoFaResult = await this.gql.query({
      query: USER_2FA_LOGIN_MUTATION,
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
      throw new Error(
        `Could not login with 2fa: ${JSON.stringify(twoFaResult.errors)}`
      )
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
    const result = await this.gql.query({
      query: GET_TICKER,
      variables: { marketName }
    })
    const ticker = result.data.getTicker as Ticker

    return ticker
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
    const result = await this.gql.query({
      query: GET_ORDERBOOK,
      variables: { marketName }
    })
    const orderBook = result.data.getOrderBook as OrderBook

    return orderBook
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
   * const tradeHistory = await nash.listTrades('neo_gas')
   * console.log(tradeHistory.trades)
   * ```
   */
  public async listTrades(
    marketName: string,
    limit?: number,
    before?: PaginationCursor
  ): Promise<TradeHistory> {
    const result = await this.gql.query({
      query: LIST_TRADES,
      variables: { marketName, limit, before }
    })

    const tradeHistory = result.data.listTrades as TradeHistory

    return tradeHistory
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
    const result = await this.gql.query({ query: LIST_TICKERS })
    const tickers = result.data.listTickers as Ticker[]

    return tickers
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
    const result = await this.gql.query({ query: LIST_ASSETS_QUERY })
    const assets = result.data.listAssets as Asset[]

    return assets
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
   * const candleRange = await nash.listCandles('neo_gas')
   * console.log(candleRange)
   * ``
   */
  public async listCandles(
    marketName: string,
    before?: DateTime,
    interval?: CandleInterval,
    limit?: number
  ): Promise<CandleRange> {
    const result = await this.gql.query({
      query: LIST_CANDLES,
      variables: { marketName, before, interval, limit }
    })
    const candleRange = result.data.listCandles as CandleRange

    return candleRange
  }

  /**
   * List all available markets.
   *
   * @returns
   *
   * Example
   * ```
   * const {markets, error} = await nash.listMarkets()
   * console.log(markets)
   * ```
   */
  public async listMarkets(): Promise<{ markets: Market[]; error: any }> {
    try {
      const result = await this.gql.query({ query: LIST_MARKETS_QUERY })
      if (result.data) {
        const markets = result.data.listMarkets as Market[]
        return { markets, error: null }
      }
      return { markets: null, error: result }
    } catch (e) {
      return { markets: null, error: e }
    }
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
    const result = await this.gql.query({
      query: GET_MARKET_QUERY,
      variables: { marketName }
    })
    const market = result.data.getMarket as Market

    return market
  }

  /**
   * list available orders for the current authenticated account.
   *
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
   * const accountOrder = await nash.listAccountOrders('neo_eth')
   * console.log(accountOrder.orders)
   * ```
   */
  public async listAccountOrders(
    before?: PaginationCursor,
    buyOrSell?: OrderBuyOrSell,
    limit?: number,
    marketName?: string,
    rangeStart?: DateTime,
    rangeStop?: DateTime,
    status?: [OrderStatus],
    type?: [OrderType]
  ): Promise<AccountOrder> {
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

    const signedPayload = await this.signPayload(listAccountOrdersParams)
    const result = await this.gql.query({
      query: LIST_ACCOUNT_ORDERS,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    })
    const accountOrder = result.data.listAccountOrders as AccountOrder

    return accountOrder
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
   * const accountTransaction = await nash.listAccountTransactions()
   * console.log(accountTransaction.transactions)
   * ```
   */
  public async listAccountTransactions(
    cursor?: string,
    fiatSymbol?: string,
    limit?: number
  ): Promise<AccountTransaction> {
    const listAccountTransactionsParams = createListAccountTransactionsParams(
      cursor,
      fiatSymbol,
      limit
    )
    const signedPayload = await this.signPayload(listAccountTransactionsParams)

    const result = await this.gql.query({
      query: LIST_ACCOUNT_TRANSACTIONS,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    })
    const accountTransactions = result.data
      .listAccountTransactions as AccountTransaction

    return accountTransactions
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
    ignoreLowBalance: boolean = false
  ): Promise<AccountBalance[]> {
    const listAccountBalanceParams = createListAccountBalanceParams(
      ignoreLowBalance
    )
    const signedPayload = await this.signPayload(listAccountBalanceParams)
    const result = await this.gql.query({
      query: LIST_ACCOUNT_BALANCES,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    })
    const accountBalances = result.data.listAccountBalances as AccountBalance[]

    return accountBalances
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
  ): Promise<AccountDepositAddress> {
    const getDepositAddressParams = createGetDepositAddressParams(currency)
    const signedPayload = await this.signPayload(getDepositAddressParams)

    const result = await this.gql.query({
      query: GET_DEPOSIT_ADDRESS,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    })
    const depositAddress = result.data
      .getDepositAddress as AccountDepositAddress

    return depositAddress
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
  public async getAccountPortfolio(
    fiatSymbol?: FiatCurrency,
    period?: Period
  ): Promise<AccountPortfolio> {
    const getAccountPortfolioParams = createAccountPortfolioParams(
      fiatSymbol,
      period
    )
    const signedPayload = await this.signPayload(getAccountPortfolioParams)

    const result = await this.gql.query({
      query: GET_ACCOUNT_PORTFOLIO,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    })
    const accountPortfolio = result.data.getAccountPortfolio as AccountPortfolio

    return accountPortfolio
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
    const getMovemementParams = createGetMovementParams(movementID)
    const signedPayload = await this.signPayload(getMovemementParams)

    const result = await this.gql.query({
      query: GET_MOVEMENT,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    })
    const movement = result.data.getMovement as Movement

    return movement
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
    const getAccountBalanceParams = createGetAccountBalanceParams(currency)
    const signedPayload = await this.signPayload(getAccountBalanceParams)

    const result = await this.gql.query({
      query: GET_ACCOUNT_BALANCE,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    })
    const accountBalance = result.data.getAccountBalance as AccountBalance

    return accountBalance
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
  public async getAccountOrder(orderID: string): Promise<Order> {
    const getAccountOrderParams = createGetAccountOrderParams(orderID)
    const signedPayload = await this.signPayload(getAccountOrderParams)

    const result = await this.gql.query({
      query: GET_ACCOUNT_ORDER,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    })
    const order = result.data.getAccountOrder as Order

    return order
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
  public async listAccountVolumes(): Promise<AccountVolume> {
    const listAccountVolumesParams = createGetAccountVolumesParams()
    const signedPayload = await this.signPayload(listAccountVolumesParams)

    const result = await this.gql.query({
      query: LIST_ACCOUNT_VOLUMES,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    })
    const accountVolumes = result.data.listAccountVolumes as AccountVolume

    return accountVolumes
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
   * const movements = await nash.listMovements()
   * console.log(movements)
   * ```
   */
  public async listMovements(
    currency?: CryptoCurrency,
    status?: MovementStatus,
    type?: MovementType
  ): Promise<Movement[]> {
    const listMovementParams = createListMovementsParams(currency, status, type)
    const signedPayload = await this.signPayload(listMovementParams)

    const result = await this.gql.query({
      query: LIST_MOVEMENTS,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    })
    const movements = result.data.listMovements as Movement[]

    return movements
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
  ): Promise<GetOrdersForMovementData> {
    const getOrdersForMovementParams = createGetOrdersForMovementParams(asset)
    const signedPayload = await this.signPayload(getOrdersForMovementParams)
    const result = await this.gql.query({
      query: GET_ORDERS_FOR_MOVEMENT_QUERY,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    })
    const getOrdersForMovementData = result.data as GetOrdersForMovementData

    return getOrdersForMovementData
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
  ): Promise<GetAssetsNoncesData> {
    const getAssetNoncesParams = createGetAssetsNoncesParams(assetList)
    const signedPayload = await this.signPayload(getAssetNoncesParams)
    const result = await this.gql.query({
      query: GET_ASSETS_NONCES_QUERY,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    })
    const getNoncesData = result.data as GetAssetsNoncesData

    return getNoncesData
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
  public async getSignAndSyncStates(): Promise<boolean> {
    try {
      const states: GetStatesData = await this.getStates()
      if (
        states.getStates.recycledOrders.length === 0 &&
        states.getStates.states.length === 0
      ) {
        return true
      }
      const signResult = (await this.signStates(states)) as SignStatesData
      if (signResult.signStates === null) {
        console.error('Error submitting signed states')
        return true
      }

      const syncResult = await this.syncStates(signResult)
      return syncResult
    } catch (error) {
      console.error(`Could not get/sign/sync states: ${error}`)
      return false
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
  public async getStates(): Promise<GetStatesData> {
    const getStatesParams = createGetStatesParams()
    const signedPayload = await this.signPayload(getStatesParams)

    try {
      const result = await this.gql.query({
        query: GET_STATES_MUTATION,
        variables: {
          payload: signedPayload.payload,
          signature: signedPayload.signature
        }
      })
      const getStatesData = result.data as GetStatesData
  
      return getStatesData  
    } catch(e) {
      console.error("Could not get states: ", e)
      return e
    }
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
    getStatesData: GetStatesData
  ): Promise<SignStatesData | Error> {
    const stateList: SyncState[] = getStatesData.getStates.states.map(state => {
      return {
        blockchain: state.blockchain,
        message: state.message
      }
    })
    const orderList: SyncState[] = getStatesData.getStates.recycledOrders.map(
      state => {
        return {
          blockchain: state.blockchain,
          message: state.message
        }
      }
    )

    const signStateListPayload: PayloadAndKind = createSignStatesParams(
      stateList,
      orderList
    )

    const signedStates: any = await this.signPayload(signStateListPayload)

    try {
      const result = await this.gql.query({
        query: SIGN_STATES_MUTATION,
        variables: {
          payload: signedStates.signedPayload,
          signature: signedStates.signature
        }
      })
  
      const signStatesData = result.data as SignStatesData
      return signStatesData  
    } catch(e) {
      console.error("Could not submit sign states data to graphql: ", e)
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
  public async syncStates(signStatesData: SignStatesData): Promise<boolean> {
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
      const result = await this.gql.query({
        query: SYNC_STATES_MUTATION,
        variables: {
          payload: signedPayload.payload,
          signature: signedPayload.signature
        }
      })
      const syncStatesResult = result.data.syncStates.result
  
      this.noncesDirty = true
      return syncStatesResult  
    } catch(e) {
      console.error("Could not query graphql for sync states: ", e)
      return e
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
  ): Promise<OrderPlaced> {
    const { nonceOrder, noncesFrom, noncesTo } = await this.getNoncesForTrade(
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
      const result = await this.gql.mutate({
        mutation: PLACE_LIMIT_ORDER_MUTATION,
        variables: {
          payload: signedPayload.signedPayload,
          signature: signedPayload.signature
        }
      })
      const orderPlaced = result.data.placeLimitOrder as OrderPlaced
      return orderPlaced
    } catch (e) {
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
    const { nonceOrder, noncesFrom, noncesTo } = await this.getNoncesForTrade(
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
      const result = await this.gql.mutate({
        mutation: PLACE_MARKET_ORDER_MUTATION,
        variables: {
          payload: signedPayload.signedPayload,
          signature: signedPayload.signature
        }
      })
      const orderPlaced = result.data.placeMarketOrder as OrderPlaced

      return orderPlaced
    } catch (e) {
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
  ): Promise<OrderPlaced> {
    const { nonceOrder, noncesFrom, noncesTo } = await this.getNoncesForTrade(
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
      const result = await this.gql.mutate({
        mutation: PLACE_STOP_LIMIT_ORDER_MUTATION,
        variables: {
          payload: signedPayload.signedPayload,
          signature: signedPayload.signature
        }
      })
      const orderPlaced = result.data.placeStopLimitOrder as OrderPlaced
      return orderPlaced
    } catch (e) {
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
    const { nonceOrder, noncesFrom, noncesTo } = await this.getNoncesForTrade(
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
      const result = await this.gql.mutate({
        mutation: PLACE_STOP_MARKET_ORDER_MUTATION,
        variables: {
          payload: signedPayload.signedPayload,
          signature: signedPayload.signature
        }
      })
      const orderPlaced = result.data.placeStopMarketOrder as OrderPlaced

      return orderPlaced
    } catch (e) {
      return this.handleOrderError(e, signedPayload)
    }
  }

  private handleOrderError(error: Error, signedPayload: any): any {
    // if order fails, we set the nonces to dirty in case the nonces caused failure

    if (error.message.includes('missing_asset_nonces')) {
      this.noncesDirty = true
      throw new MissingNonceError(error.message, signedPayload)
    } else if (error.message.includes('Insufficient Funds')) {
      throw new InsufficientFundsError(error.message, signedPayload)
    }
    throw new Error(
      `Could not place order: ${JSON.stringify(
        error
      )} using payload: ${JSON.stringify(signedPayload.blockchain_raw)}`
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
    this.noncesDirty = true
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
    this.noncesDirty = true
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

    const url = this.opts.casURI + '/auth/add_initial_wallets_and_client_keys'
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

  private async updateTradedAssetNonces(): Promise<boolean> {
    if (this.noncesDirty === false) {
      return true
    }

    try {
      const nonces = await this.getAssetNonces(this.tradedAssets)
      const assetNonces = {}
      nonces.getAssetsNonces.forEach(item => {
        assetNonces[item.asset] = item.nonces
      })
      this.assetNonces = assetNonces
      this.noncesDirty = false
      return true
    } catch (e) {
      console.log(`Could not update traded asset nonces: ${JSON.stringify(e)}`)
      return false
    }
  }

  private createTimestamp32(): number {
    return Math.trunc(new Date().getTime() / 10) - 155000000000
  }

  private async getNoncesForTrade(
    marketName: string,
    direction: OrderBuyOrSell
  ): Promise<NonceSet> {
    try {
      const pairs = marketName.split('_')
      const unitA = pairs[0]
      const unitB = pairs[1]

      if (!this.tradedAssets.includes(unitA)) {
        this.noncesDirty = true
        this.tradedAssets.push(unitA)
      }
      if (!this.tradedAssets.includes(unitB)) {
        this.noncesDirty = true
        this.tradedAssets.push(unitB)
      }

      await this.updateTradedAssetNonces()

      let noncesTo = this.assetNonces[unitA]
      let noncesFrom = this.assetNonces[unitB]

      if (direction === OrderBuyOrSell.SELL) {
        noncesTo = this.assetNonces[unitB]
        noncesFrom = this.assetNonces[unitA]
      }

      return {
        noncesTo,
        noncesFrom,
        nonceOrder: this.createTimestamp32()
      }
    } catch (e) {
      console.log(`Could not get nonce set: ${e}`)
      return e
    }
  }

  private async fetchMarketData(): Promise<{ [key: string]: Market }> {
    if (this.opts.debug) {
      console.log('fetching latest exchange market data')
    }
    const { markets, error } = await this.listMarkets()
    if (markets) {
      const marketData = {}
      let market: Market
      for (const it of Object.keys(markets)) {
        market = markets[it]
        marketData[market.name] = market
      }

      return marketData
    } else {
      return error
    }
  }

  private async fetchAssetData(): Promise<{ [key: string]: AssetData }> {
    const assetList = {}
    try {
      const assets = await this.listAssets()
      for (const a of assets) {
        assetList[a.symbol] = {
          hash: a.hash,
          precision: 8,
          blockchain: a.blockchain
        }
      }
    } catch (e) {
      console.log('Could not get assets: ', e)
      return null
    }
    return assetList
  }
}
