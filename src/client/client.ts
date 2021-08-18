import * as AbsintheSocket from '@absinthe/socket'
import { PerfClient } from '@neon-exchange/nash-perf'
import setCookie from 'set-cookie-parser'
import fetch from 'node-fetch'
import toHex from 'array-buffer-to-hex'
import https from 'https'
import http from 'http'
import Promievent from 'promievent'

import BigNumber from 'bignumber.js'
import { ApolloError } from './ApolloError'
import { LIST_MARKETS_QUERY } from '../queries/market/listMarkets'
import { GET_MARKET_QUERY } from '../queries/market/getMarket'
import {
  LIST_ACCOUNT_TRANSACTIONS,
  ListAccountTransactionsParams
} from '../queries/account/listAccountTransactions'
import {
  LIST_ACCOUNT_ORDERS,
  LIST_ACCOUNT_ORDERS_WITH_TRADES,
  ListAccountOrderParams
} from '../queries/order/listAccountOrders'
import {
  LIST_ACCOUNT_TRADES,
  ListAccountTradeParams
} from '../queries/trade/listAccountTrades'
import {
  GET_ACCOUNT_ADDRESS,
  GetAccountAddressParams,
  GetAccountAddressResult
} from '../queries/account/getAccountAddress'
import { LIST_ACCOUNT_BALANCES } from '../queries/account/listAccountBalances'
import { GET_ACCOUNT_VOLUMES } from '../queries/account/getAccountVolumes'
import {
  LIST_MOVEMENTS,
  ListMovementsParams
} from '../queries/movement/listMovements'
import { GET_ACCOUNT_BALANCE } from '../queries/account/getAccountBalance'
import { GET_ACCOUNT_ORDER } from '../queries/order/getAccountOrder'
import { GET_MOVEMENT } from '../queries/movement/getMovement'
import { GET_TICKER } from '../queries/market/getTicker'
import { CANCEL_ORDER_MUTATION } from '../mutations/orders/cancelOrder'
import { CANCEL_ALL_ORDERS_MUTATION } from '../mutations/orders/cancelAllOrders'
import {
  GET_BLOCKCHAIN_FEES,
  BlockchainFees
} from '../queries/movement/getBlockchainFees'

import {
  USER_2FA_LOGIN_MUTATION,
  TwoFactorLoginResponse
} from '../mutations/account/twoFactorLoginMutation'

import {
  SIGN_IN_MUTATION,
  SignInArgs,
  SignInResult
} from '../mutations/account/signIn'

import {
  ADD_KEYS_WITH_WALLETS_MUTATION,
  AddKeysArgs,
  AddKeysResult
} from '../mutations/account/addKeysWithWallets'

import {
  LIST_CANDLES,
  ListCandlesParams
} from '../queries/candlestick/listCandles'
import { LIST_TICKERS } from '../queries/market/listTickers'
import { LIST_TRADES, ListTradeParams } from '../queries/market/listTrades'
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
import {
  UPDATE_MOVEMENT_MUTATION,
  UpdateMovementData
} from '../mutations/movements/updateMovement'
import { AddMovement } from '../mutations/movements/fragments/addMovementFragment'
import {
  GET_ACCOUNT_PORTFOLIO,
  GetAccountPortfolioParams
} from '../queries/account/getAccountPortfolio'
import { LIST_ASSETS_QUERY } from '../queries/asset/listAsset'

import { NEW_ACCOUNT_TRADES } from '../subscriptions/newAccountTrades'
import { UPDATED_ACCOUNT_ORDERS } from '../subscriptions/updatedAccountOrders'
import { NEW_TRADES } from '../subscriptions/newTrades'
import { UPDATED_TICKERS } from '../subscriptions/updatedTickers'
import { UPDATED_CANDLES } from '../subscriptions/updatedCandles'
import { UPDATED_ACCOUNT_BALANCE } from '../subscriptions/updatedAccountBalance'

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
  checkMandatoryParams,
  detectBlockchain,
  sleep,
  sanitizeAddMovementPayload
} from './utils'

import {
  GetStatesData,
  SyncStatesData,
  SignStatesData,
  SIGN_STATES_MUTATION,
  SYNC_STATES_MUTATION
} from '../mutations/stateSyncing'

import {
  SEND_BLOCKCHAIN_RAW_TRANSACTION,
  SendBlockchainRawTransactionArgs,
  SendBlockchainRawTransactionResult
} from '../mutations/blockchain/sendBlockchainRawTransaction'

import {
  CreateApiKeyArgs,
  CreateApiKeyResponse,
  CreateApiKeyResult,
  CREATE_APIKEY_MUTATION
} from '../mutations/account/createApiKey'
import { PaillierProof } from '../mutations/account/generatePallierProof'
import {
  InputApproveTransaction,
  ITERATE_TRANSATION_MUTATION,
  PrepareTransactionParams,
  PrepareTransactionResponse,
  PREPARE_TRANSATION_MUTATION
} from '../mutations/movements/prepareTransaction'

import {
  normalizePriceForMarket,
  mapMarketsForNashProtocol,
  normalizeAmountForMarket
} from '../helpers'
import {
  OrderBook,
  TradeHistory,
  Ticker,
  CandleRange,
  Movement,
  AccountPortfolio,
  CancelledOrder,
  AccountBalance,
  AccountTransaction,
  OrderPlaced,
  Market,
  AccountVolume,
  Order,
  DateTime,
  AccountOrder,
  OrderBuyOrSell,
  OrderCancellationPolicy,
  MovementType,
  CurrencyAmount,
  MovementStatus,
  CurrencyPrice,
  LegacyLoginParams,
  NonceSet,
  AssetData,
  Asset,
  MissingNonceError,
  InsufficientFundsError,
  PlaceLimitOrderParams,
  OrdersPlaced,
  OrdersCancelledAndPlaced
} from '../types'
import {
  ClientMode,
  GQL,
  NashSocketEvents,
  GQLResp,
  PayloadSignature
} from '../types/client'
import gql, { default as gqlstring } from 'graphql-tag'

import { BlockchainError } from './movements'
import { gqlToString } from './queryPrinter'
import { CryptoCurrency } from '../constants/currency'

import {
  APIKey,
  BIP44,
  Blockchain,
  bufferize,
  Config,
  createCancelOrderParams,
  createGetAssetsNoncesParams,
  createListMovementsParams,
  createPlaceLimitOrderParams,
  createPlaceMarketOrderParams,
  createPlaceStopLimitOrderParams,
  createPlaceStopMarketOrderParams,
  createSendBlockchainRawTransactionParams,
  createSignStatesParams,
  createSyncStatesParams,
  createTimestamp,
  createTimestamp32,
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
  fillRPoolIfNeeded,
  SyncState,
  GenerateProofFn,
  decryptSecretKey,
  generateAPIKeys,
  GenerateApiKeysParams
} from '@neon-exchange/nash-protocol'

import {
  States,
  SignStatesFields
} from 'mutations/stateSyncing/fragments/signStatesFragment'

import { prefixWith0xIfNeeded } from './ethUtils'

export * from './environments'
import {
  EnvironmentConfig,
  ClientOptions,
  EnvironmentConfiguration
} from './environments'
import { Socket as PhoenixSocket } from '../client/phoenix'

const WebSocket = require('websocket').w3cwebsocket

/** @internal */
const BLOCKCHAIN_TO_BIP44 = {
  [Blockchain.ETH]: BIP44.ETH,
  [Blockchain.BTC]: BIP44.BTC,
  [Blockchain.NEO]: BIP44.NEO,
  [Blockchain.AVAXC]: BIP44.AVAXC
}

/** @internal */
const ORDERS_REMAINING_TO_AUTOSYNC_AT = 20
/** @internal */

/** @internal */
export const MISSING_NONCES = 'missing_asset_nonces'
/** @internal */
export const MAX_ORDERS_REACHED = 'Maximal number of orders have been reached'
/** @internal */
export const MAX_SIGN_STATE_RECURSION = 5
/** @internal */
export const BIG_NUMBER_FORMAT = {
  decimalSeparator: '.',
  groupSeparator: '',
  groupSize: 50,
  prefix: ''
}

export const UNLIMITED_APPROVAL =
  '0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe'
export const ACCEPTABLE_APPROVAL = '0xffffffffffffffffffffffffffffe'
export class Client {
  private _socket = null
  private mode: ClientMode = ClientMode.NONE
  private opts: EnvironmentConfig
  private clientOpts: ClientOptions
  private apiUri: string
  private _headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  private get headers(): Record<string, string> {
    return {
      ...this.clientOpts.headers,
      ...this._headers
    }
  }

  private _subscriptionHandlers: NashSocketEvents
  private _absintheSocket = null
  private initParams: InitParams
  private nashCoreConfig: Config
  private casCookie: string
  private publicKey: string
  private account?: SignInResult['signIn']['account']

  private wsToken: string
  private wsUri: string
  private gql: GQL
  private authorization: string
  private walletIndices: { [key: string]: number }

  private tradedAssets: string[] = []
  private assetNonces: { [key: string]: number[] }
  private currentOrderNonce: number
  private signStateInProgress: boolean
  private pallierPkStr: string
  /** @internal */
  public perfClient: PerfClient
  /** @internal */
  public apiKey: APIKey
  /** @internal */
  public marketData: { [key: string]: Market }
  /** @internal */
  public nashProtocolMarketData: ReturnType<typeof mapMarketsForNashProtocol>
  /** @internal */
  public assetData: { [key: string]: AssetData }

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
      maxEthCostPrTransaction: '0.05',
      ...opts
    }
    this.clientOpts = {
      autoSignState: true,
      runRequestsOverWebsockets: false,
      headers: {},
      ...clientOpts
    }

    if (!opts.host || (opts.host.indexOf('.') === -1 && !opts.isLocal)) {
      throw new Error(`Invalid API host '${opts.host}'`)
    }

    const protocol = opts.isLocal ? 'http' : 'https'
    let telemetrySend = async (_: any) => null
    let agent
    if (opts.isLocal) {
      agent = new http.Agent({
        keepAlive: true
      })
    } else {
      agent = new https.Agent({
        keepAlive: true
      })
    }
    if (!opts.isLocal && this.clientOpts.enablePerformanceTelemetry === true) {
      const telemetryUrl =
        'https://telemetry.' + /^app.(.+)$/.exec(opts.host)[1]
      telemetrySend = async data => {
        const r = await fetch(telemetryUrl, {
          method: 'post',
          agent,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        })
        if (r.status !== 200) {
          throw new Error('status' + r.status)
        }
      }
    }
    this.perfClient = new PerfClient({
      tag:
        'ts-api-client-' +
        (this.clientOpts.performanceTelemetryTag || 'unknown'),
      post: telemetrySend
    })
    if (!this.clientOpts.enablePerformanceTelemetry) {
      this.perfClient.measure = () => null
    }
    this.apiUri = `${protocol}://${opts.host}/api/graphql`
    this.wsUri = `wss://${opts.host}/api/socket`
    // this.maxEthCostPrTransaction = new BigNumber(
    //   this.web3.utils.toWei(this.opts.maxEthCostPrTransaction)
    // )
    if (
      this.opts.maxEthCostPrTransaction == null ||
      isNaN(parseFloat(this.opts.maxEthCostPrTransaction))
    ) {
      throw new Error(
        'maxEthCostPrTransaction is invalid ' +
          this.opts.maxEthCostPrTransaction
      )
    }

    const query: GQL['query'] = async params => {
      let obj: GQLResp<any>

      if (
        this.mode !== ClientMode.NONE &&
        this.clientOpts.runRequestsOverWebsockets
      ) {
        const promise: any = new Promise((resolve, reject) =>
          AbsintheSocket.observe(
            this.getAbsintheSocket(),
            AbsintheSocket.send(this.getAbsintheSocket(), {
              operation: gqlToString(params.query),
              variables: params.variables
            }),
            {
              onResult: res => resolve(res),
              onAbort: errs => reject(errs),
              onError: errs => reject(errs)
            }
          )
        )
        const result = await promise
        return result
      } else {
        const resp = await fetch(this.apiUri, {
          method: 'POST',
          headers: this.headers,
          agent,
          body: JSON.stringify({
            query: gqlToString(params.query),
            variables: params.variables
          }),
          timeout: 30000
        })
        if (resp.status !== 200) {
          let msg = `API error. Status code: ${resp.status}`
          if (resp.body) {
            const responseContent = await resp.text()
            msg += ` / body: ${responseContent}`
          }
          throw new Error(msg)
        }
        obj = await resp.json()
        obj.headers = resp.headers
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

  get affiliateDeveloperCode() {
    const { affiliateCode, affiliateLabel } = this.clientOpts
    if (affiliateCode == null) {
      return undefined
    }
    if (affiliateLabel == null) {
      return affiliateCode
    }
    return `${affiliateCode}:${affiliateLabel}`
  }

  public async prefillRPoolIfNeeded(blockchain: Blockchain): Promise<void> {
    const fillRPool = this.perfClient.start(
      'prefillRPoolIfNeeded_' + blockchain
    )
    await fillRPoolIfNeeded({
      fillPoolFn: this.fillPoolFn,
      blockchain,
      paillierPkStr: this.pallierPkStr
    })
    // Ignore it delta is like 1ms or 0. Because that means no work was done
    if (fillRPool.delta() > 1) {
      fillRPool.end()
    }
  }

  public async prefillRPoolIfNeededForAssets(
    asset1: CryptoCurrency,
    asset2?: CryptoCurrency
  ): Promise<void> {
    const blockchain1 = this.assetData[asset1].blockchain.toUpperCase()
    await this.prefillRPoolIfNeeded(blockchain1 as any)
    if (asset2 == null) {
      return
    }
    const blockchain2 = this.assetData[asset2].blockchain.toUpperCase()
    if (blockchain2 === blockchain1) {
      return
    }
    await this.prefillRPoolIfNeeded(blockchain2 as any)
  }

  public disconnect() {
    if (this._socket == null) {
      return
    }
    this._socket.disconnect()
    this._socket = null
    this._absintheSocket = null
    this._subscriptionHandlers = null
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
  private _createSocket() {
    const clientHeaders = { ...this.clientOpts.headers }

    const Transport =
      Object.keys(clientHeaders).length === 0
        ? WebSocket
        : // tslint:disable-next-line
          class extends WebSocket {
            constructor(endpoint) {
              super(endpoint, undefined, undefined, clientHeaders)
            }
          }
    const socket = new PhoenixSocket(this.wsUri, {
      transport: Transport,
      automaticReconnect: !this.clientOpts.disableSocketReconnect,
      decode: (rawPayload, callback) => {
        const [join_ref, ref, topic, event, payload] = JSON.parse(rawPayload)

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
    socket.connect()
    return socket
  }
  private getAbsintheSocket() {
    if (this._absintheSocket != null) {
      return this._absintheSocket
    }
    this._absintheSocket = AbsintheSocket.create(this.getSocket())
    return this._absintheSocket
  }
  public getSocket() {
    if (this._socket != null) {
      return this._socket
    }
    this._socket = this._createSocket()
    return this._socket
  }
  private wsAuthCheck(sub: string) {
    if (this.wsToken == null) {
      throw new Error(
        'To use ' +
          sub +
          ', you must login() before creating the socket connection'
      )
    }
  }
  /**
   * Returns the connect socket
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
   * // Getting the orderbook for the neo_eth marked
   * nash.subscriptions.onUpdatedOrderbook(
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
   * nash.subscriptions.onUpdatedAccountOrders(
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
  get subscriptions() {
    if (this._subscriptionHandlers) {
      return this._subscriptionHandlers
    }
    this._subscriptionHandlers = this._createSocketConnection()
    return this._subscriptionHandlers
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
   *
   * @deprecated please use subscriptions
   * ```
   */
  createSocketConnection(): NashSocketEvents {
    return this.subscriptions
  }

  private _createSocketConnection(): NashSocketEvents {
    if (this.wsUri == null) {
      throw new Error('wsUri config parameter missing')
    }
    return {
      disconnect: () => this.disconnect(),
      socket: this.getSocket(),
      absintheSocket: this.getAbsintheSocket(),
      onUpdatedAccountOrders: async (payload, handlers) => {
        this.wsAuthCheck('onUpdatedAccountOrders')
        AbsintheSocket.observe(
          this.getAbsintheSocket(),
          AbsintheSocket.send(this.getAbsintheSocket(), {
            operation: gqlToString(UPDATED_ACCOUNT_ORDERS),
            variables: {
              payload
            }
          }),
          handlers
        )
      },
      onUpdatedCandles: (variables, handlers) =>
        AbsintheSocket.observe(
          this.getAbsintheSocket(),
          AbsintheSocket.send(this.getAbsintheSocket(), {
            operation: gqlToString(UPDATED_CANDLES),
            variables
          }),
          handlers
        ),
      onUpdatedTickers: handlers => {
        AbsintheSocket.observe(
          this.getAbsintheSocket(),
          AbsintheSocket.send(this.getAbsintheSocket(), {
            operation: gqlToString(UPDATED_TICKERS),
            variables: {}
          }),
          handlers
        )
      },
      onUpdatedAccountBalance: (payload, handlers) => {
        AbsintheSocket.observe(
          this.getAbsintheSocket(),
          AbsintheSocket.send(this.getAbsintheSocket(), {
            operation: gqlToString(UPDATED_ACCOUNT_BALANCE),
            variables: {
              payload
            }
          }),
          handlers
        )
      },
      onNewTrades: (variables, handlers) => {
        AbsintheSocket.observe(
          this.getAbsintheSocket(),
          AbsintheSocket.send(this.getAbsintheSocket(), {
            operation: gqlToString(NEW_TRADES),
            variables
          }),
          handlers
        )
      },
      onUpdatedOrderbook: (variables, handlers) => {
        const channel = this.getSocket().channel(
          'public_order_book:' + variables.marketName,
          {}
        )
        channel
          .join()
          .receive('ok', initial => {
            if (handlers.onStart) {
              handlers.onStart({
                data: {
                  updatedOrderBook: initial
                }
              })
            }
            if (handlers.onResult) {
              handlers.onResult({
                data: {
                  updatedOrderBook: initial
                }
              })
            }
            channel.on('update', update => {
              if (handlers.onResult) {
                handlers.onResult({
                  data: {
                    updatedOrderBook: update
                  }
                })
              }
            })
          })
          .receive('error', resp => {
            if (handlers.onAbort) {
              handlers.onAbort(resp)
            }
            if (handlers.onError) {
              handlers.onError(resp)
            }
          })
      },
      onAccountTrade: async (payload, handlers) => {
        this.wsAuthCheck('onAccountTrade')
        AbsintheSocket.observe(
          this.getAbsintheSocket(),
          AbsintheSocket.send(this.getAbsintheSocket(), {
            operation: gqlToString(NEW_ACCOUNT_TRADES),
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
    this.apiKey = JSON.parse(Buffer.from(secret, 'base64').toString('utf-8'))
    this._headers = {
      'Content-Type': 'application/json',
      Authorization: this.authorization
    }
    this.disconnect()
    this.marketData = await this.fetchMarketData()
    this.nashProtocolMarketData = mapMarketsForNashProtocol(this.marketData)
    this.assetData = await this.fetchAssetData()
    this.pallierPkStr = JSON.stringify(this.apiKey.paillier_pk)
    this.currentOrderNonce = createTimestamp32()
    await this.updateTradedAssetNonces()
  }

  /**
   * Legacy login against the central account service. Note: you should prefer to use an API key with the `login` method.
   *
   * Be careful about using this feature, private keys are derived using the password.
   * So this technically gives full access to the account. Because of this the following features are not supported using legacy login.
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
   *   nash.passwordLogin({
   *     email: "email@domain.com",
   *     password: "example"
   *   })
   * } catch (e) {
   *   console.error(`login failed ${e}`)
   * }
   * ```
   */
  public async passwordLogin({
    email,
    password,
    twoFaCode,
    walletIndices = { neo: 1, eth: 1, btc: 1 },
    salt = '',
    net = 'MainNet'
  }: LegacyLoginParams): Promise<Config> {
    this.walletIndices = walletIndices
    const keys = await getHKDFKeysFromPassword(password, salt)

    const resp = await this.gql.mutate<SignInResult, SignInArgs>({
      mutation: SIGN_IN_MUTATION,
      variables: {
        email,
        password: keys.authKey.toString('hex')
      }
    })

    this.mode = ClientMode.FULL_SECRET

    const cookies = setCookie.parse(
      setCookie.splitCookiesString(resp.headers.get('set-cookie'))
    )

    const cookie = cookies.find(c => c.name === 'nash-cookie')
    this.casCookie = cookie.name + '=' + cookie.value
    this._headers = {
      'Content-Type': 'application/json',
      Cookie: this.casCookie
    }
    const m = /nash-cookie=([0-9a-z-]+)/.exec(this.casCookie)
    if (m == null) {
      throw new Error('Failed to login, invalid casCookie: ' + this.casCookie)
    }
    this.wsToken = m[1]
    this.disconnect()
    if (resp.errors) {
      throw new Error(resp.errors[0].message)
    }

    this.account = resp.data.signIn.account
    this.marketData = await this.fetchMarketData()
    this.assetData = await this.fetchAssetData()
    this.assetNonces = {}
    this.currentOrderNonce = createTimestamp32()
    if (resp.data.signIn.twoFaRequired) {
      if (twoFaCode !== undefined) {
        this.account = await this.doTwoFactorLogin(twoFaCode)
      } else {
        // 2FA code is undefined. Check if needed by backend
        throw new Error(
          'Login requires 2 factor code, but no twoFaCode argument supplied'
        )
      }
    }
    if (this.account == null) {
      throw new Error('Failed to sign in')
    }

    if (resp.data.signIn.account.encryptedSecretKey === null) {
      await this.createAndUploadKeys(keys.encryptionKey, net)
    }

    const aead = {
      encryptedSecretKey: bufferize(this.account.encryptedSecretKey),
      nonce: bufferize(this.account.encryptedSecretKeyNonce),
      tag: bufferize(this.account.encryptedSecretKeyTag)
    }

    this.initParams = {
      walletIndices: this.walletIndices,
      encryptionKey: keys.encryptionKey,
      aead,
      marketData: mapMarketsForNashProtocol(this.marketData),
      assetData: this.assetData,
      net: net as 'MainNet' | 'TestNet' | 'LocalNet'
    }

    this.nashCoreConfig = await initialize(this.initParams)

    this.publicKey = this.nashCoreConfig.payloadSigningKey.publicKey
    // after login we should always try to get asset nonces
    await this.updateTradedAssetNonces()
    return this.nashCoreConfig
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

  public createApiKey = async (
    name: string,
    password: string,
    walletIndices: any,
    network: 'LocalNet' | 'MainNet' = 'LocalNet',
    twoFaCode?: string
  ): Promise<CreateApiKeyResult> => {
    try {
      const keys = await getHKDFKeysFromPassword(password, '')

      const createApiKeyData = await this.gql.mutate<
        CreateApiKeyResponse,
        CreateApiKeyArgs
      >({
        mutation: CREATE_APIKEY_MUTATION,
        variables: {
          name,
          password: keys.authKey.toString('hex'),
          twoFa: twoFaCode
        }
      })

      const { token, secrets } = createApiKeyData.data.createApiKey
      const generateProofFn: GenerateProofFn = async () => {
        const generateQueryResp = await this.gql.query<{
          getPaillierProof: PaillierProof
        }>({
          query: gql`
            query ApiKeysViewGenerateProof {
              getPaillierProof {
                correctKeyProof {
                  sigmaVec
                }
                paillierPk {
                  n
                }
              }
            }
          `
        })
        if (
          generateQueryResp.errors != null ||
          generateQueryResp.data == null
        ) {
          throw new Error('gen proof failed')
        }
        const ret = {
          correct_key_proof: {
            sigma_vec: generateQueryResp.data.getPaillierProof.correctKeyProof
              .sigmaVec as string[]
          },
          paillier_pk: {
            n: generateQueryResp.data.getPaillierProof.paillierPk.n[0]!
          }
        }
        return ret
      }

      const secretKey = await decryptSecretKey(keys.encryptionKey, {
        encryptedSecretKey: bufferize(secrets.encryptedSecretKey),
        nonce: bufferize(secrets.encryptedSecretKeyNonce),
        tag: bufferize(secrets.encryptedSecretKeyTag)
      })
      const generateKeyParams: GenerateApiKeysParams = {
        walletIndices,
        secret: secretKey.toString('hex'),
        net: network,
        generateProofFn
      }
      const apiKeys = await generateAPIKeys(generateKeyParams)

      const apiSecret = Buffer.from(JSON.stringify(apiKeys), 'utf-8').toString(
        'base64'
      )

      return {
        apiKey: token,
        secret: apiSecret
      }
    } catch (e) {
      console.error('Error creating API Keys: ', e)
      return null
    }
  }

  private async createAndUploadKeys(
    encryptionKey: Buffer,
    net: string
  ): Promise<void> {
    const secretKey = getSecretKey()
    const res = encryptSecretKey(encryptionKey, secretKey)

    this.account.encryptedSecretKey = res.encryptedSecretKey.toString('hex')
    this.account.encryptedSecretKeyTag = res.tag.toString('hex')
    this.account.encryptedSecretKeyNonce = res.nonce.toString('hex')

    const aead = {
      encryptedSecretKey: bufferize(this.account.encryptedSecretKey),
      nonce: bufferize(this.account.encryptedSecretKeyNonce),
      tag: bufferize(this.account.encryptedSecretKeyTag)
    }

    this.initParams = {
      walletIndices: this.walletIndices,
      encryptionKey,
      aead,
      marketData: mapMarketsForNashProtocol(this.marketData),
      assetData: this.assetData,
      net: net as 'MainNet' | 'TestNet' | 'LocalNet'
    }

    this.nashCoreConfig = await initialize(this.initParams)

    this.publicKey = this.nashCoreConfig.payloadSigningKey.publicKey
    await this.gql.mutate<AddKeysResult, AddKeysArgs>({
      mutation: ADD_KEYS_WITH_WALLETS_MUTATION,
      variables: {
        encryptedSecretKey: toHex(this.initParams.aead.encryptedSecretKey),
        encryptedSecretKeyNonce: toHex(this.initParams.aead.nonce),
        encryptedSecretKeyTag: toHex(this.initParams.aead.tag),
        signaturePublicKey: this.nashCoreConfig.payloadSigningKey.publicKey,
        wallets: [
          {
            address: this.nashCoreConfig.wallets.neo.address,
            blockchain: 'NEO',
            publicKey: this.nashCoreConfig.wallets.neo.publicKey,
            chainIndex: this.nashCoreConfig.wallets.neo.index
              ? this.nashCoreConfig.wallets.neo.index
              : 0
          },
          {
            address: this.nashCoreConfig.wallets.eth.address,
            blockchain: 'ETH',
            publicKey: this.nashCoreConfig.wallets.eth.publicKey,
            chainIndex: this.nashCoreConfig.wallets.eth.index
              ? this.nashCoreConfig.wallets.eth.index
              : 0
          },
          {
            address: this.nashCoreConfig.wallets.btc.address,
            blockchain: 'BTC',
            publicKey: this.nashCoreConfig.wallets.btc.publicKey,
            chainIndex: this.nashCoreConfig.wallets.btc.index
              ? this.nashCoreConfig.wallets.btc.index
              : 0
          }
        ]
      }
    })
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
   * Fetches the current account volumes for the current periods
   *
   * @returns
   *
   * Example
   * ```
   * const volumes = await nash.getAccountVolumes()
   * console.log(volumes.makerFeeRate)
   * console.log(volumes.takerFeeRate)
   * ```
   */
  public async getAccountVolumes(): Promise<AccountVolume> {
    const result = await this.gql.query<{ getAccountVolumes: AccountVolume }>({
      query: GET_ACCOUNT_VOLUMES,
      variables: {
        payload: {}
      }
    })
    return result.data.getAccountVolumes
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
  public async getMovement(movementID: string): Promise<Movement> {
    const getMovemementParams = {
      payload: {
        movement_id: movementID,
        timestamp: createTimestamp()
      },
      kind: SigningPayloadID.getMovementPayload
    }
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
    const listMovementParams = createListMovementsParams(
      currency as string,
      status,
      type
    )
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
   * @param sync Whether to sync the state updates to the blockchain. Defaults to false
   *
   * @returns
   *
   * Example
   * ```
   * // sign states
   * const signStates = await nash.getSignAndSyncStates()
   * console.log(signStates)
   *
   * // sign and sync states to blockchain
   * const signAndSyncStates = await nash.getSignAndSyncStates(true)
   * console.log(signAndSyncStates)
   *
   * ```
   */
  public async getSignAndSyncStates(
    sync = false
  ): Promise<SyncStatesData | SignStatesData> {
    this.signStateInProgress = true

    const emptyStates: GetStatesData = {
      states: [],
      recycledOrders: [],
      serverSignedStates: []
    }
    const signStatesRecursive: SignStatesData = await this.signStates(
      emptyStates
    )
    this.signStateInProgress = false

    if (sync) {
      const syncResult = await this.syncStates(signStatesRecursive)
      return syncResult
    }
    return signStatesRecursive
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
    const signStatesMeasure = this.perfClient.start('signStates')

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
      if (depth === 0) {
        signStatesMeasure.end()
      }
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
    const m1 = this.perfClient.start('cancelOrder')
    const m2 = this.perfClient.start('cancelOrder_' + marketName)
    const [a, b] = marketName.split('_')
    await this.prefillRPoolIfNeededForAssets(
      a as CryptoCurrency,
      b as CryptoCurrency
    )
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
    m1.end()
    m2.end()
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
    const m1 = this.perfClient.start('cancelAllOrders')
    const m2 = this.perfClient.start('cancelAllOrders_' + (marketName || 'all'))
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
    m1.end()
    m2.end()

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
    const measurementPlaceOrder = this.perfClient.start('placeLimitOrder')
    const measurementPlaceLimitOrder = this.perfClient.start(
      'placeLimitOrder_' + marketName
    )
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
    await this.prefillRPoolIfNeededForAssets(
      limitPrice.currencyA,
      limitPrice.currencyB
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
    const measurementSignPayload = this.perfClient.start(
      'signPayloadLimitOrder_' + marketName
    )
    const signedPayload = await this.signPayload(placeLimitOrderParams)
    measurementSignPayload.end()
    try {
      const result = await this.gql.mutate<{
        placeLimitOrder: OrderPlaced
      }>({
        mutation: PLACE_LIMIT_ORDER_MUTATION,
        variables: {
          affiliateDeveloperCode: this.affiliateDeveloperCode,
          payload: signedPayload.signedPayload,
          signature: signedPayload.signature
        }
      })
      measurementPlaceOrder.end()
      measurementPlaceLimitOrder.end()

      await this.handleOrderPlaced(result.data.placeLimitOrder)

      return result.data.placeLimitOrder
    } catch (e) {
      let replaceOrder = false
      if (e.message.includes(MISSING_NONCES)) {
        replaceOrder = true
        await this.updateTradedAssetNonces()
      } else if (e.message.includes(MAX_ORDERS_REACHED)) {
        if (this.clientOpts.autoSignState && !this.signStateInProgress) {
          replaceOrder = true
          await this.getSignAndSyncStates()
        }
      }
      if (replaceOrder) {
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
    const measurementPlaceOrder = this.perfClient.start('placeMarketOrder')
    const measurementPlaceMarketOrder = this.perfClient.start(
      'placeMarketOrder_' + marketName
    )
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
    const [a, b] = marketName.split('_')
    await this.prefillRPoolIfNeededForAssets(
      a as CryptoCurrency,
      b as CryptoCurrency
    )
    const placeMarketOrderParams = createPlaceMarketOrderParams(
      normalizedAmount,
      buyOrSell,
      marketName,
      noncesFrom,
      noncesTo,
      nonceOrder
    )

    const measurementSignPayload = this.perfClient.start(
      'signPayloadMarketOrder_' + marketName
    )
    const signedPayload = await this.signPayload(placeMarketOrderParams)
    measurementSignPayload.end()
    try {
      const result = await this.gql.mutate<{
        placeMarketOrder: OrderPlaced
      }>({
        mutation: PLACE_MARKET_ORDER_MUTATION,
        variables: {
          affiliateDeveloperCode: this.affiliateDeveloperCode,
          payload: signedPayload.signedPayload,
          signature: signedPayload.signature
        }
      })
      measurementPlaceOrder.end()
      measurementPlaceMarketOrder.end()
      await this.handleOrderPlaced(result.data.placeMarketOrder)
      return result.data.placeMarketOrder
    } catch (e) {
      let replaceOrder = false
      if (e.message.includes(MISSING_NONCES)) {
        replaceOrder = true
        await this.updateTradedAssetNonces()
      } else if (e.message.includes(MAX_ORDERS_REACHED)) {
        if (this.clientOpts.autoSignState && !this.signStateInProgress) {
          replaceOrder = true
          await this.getSignAndSyncStates()
        }
      }
      if (replaceOrder) {
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
    const measurementPlaceOrder = this.perfClient.start('placeStopLimitOrder')
    const measurementPlaceMarketOrder = this.perfClient.start(
      'placeStopLimitOrder_' + marketName
    )
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
    await this.prefillRPoolIfNeededForAssets(
      limitPrice.currencyA,
      limitPrice.currencyB
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
    const measurementSignPayload = this.perfClient.start(
      'signPayloadStopLimitOrder_' + marketName
    )
    const signedPayload = await this.signPayload(placeStopLimitOrderParams)
    measurementSignPayload.end()
    try {
      const result = await this.gql.mutate<{
        placeStopLimitOrder: OrderPlaced
      }>({
        mutation: PLACE_STOP_LIMIT_ORDER_MUTATION,
        variables: {
          affiliateDeveloperCode: this.affiliateDeveloperCode,
          payload: signedPayload.signedPayload,
          signature: signedPayload.signature
        }
      })
      measurementPlaceOrder.end()
      measurementPlaceMarketOrder.end()
      await this.handleOrderPlaced(result.data.placeStopLimitOrder)
      return result.data.placeStopLimitOrder
    } catch (e) {
      let replaceOrder = false
      if (e.message.includes(MISSING_NONCES)) {
        replaceOrder = true
        await this.updateTradedAssetNonces()
      } else if (e.message.includes(MAX_ORDERS_REACHED)) {
        if (this.clientOpts.autoSignState && !this.signStateInProgress) {
          replaceOrder = true
          await this.getSignAndSyncStates()
        }
      }
      if (replaceOrder) {
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
    const measurementPlaceOrder = this.perfClient.start('placeStopMarketOrder')
    const measurementPlaceMarketOrder = this.perfClient.start(
      'placeStopMarketOrder_' + marketName
    )
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
    const [a, b] = marketName.split('_')
    await this.prefillRPoolIfNeededForAssets(
      a as CryptoCurrency,
      b as CryptoCurrency
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
    const measurementSignPayload = this.perfClient.start(
      'signPayloadStopMarketOrder_' + marketName
    )
    const signedPayload = await this.signPayload(placeStopMarketOrderParams)
    measurementSignPayload.end()
    try {
      const result = await this.gql.mutate<{
        placeStopMarketOrder: OrderPlaced
      }>({
        mutation: PLACE_STOP_MARKET_ORDER_MUTATION,
        variables: {
          affiliateDeveloperCode: this.affiliateDeveloperCode,
          payload: signedPayload.signedPayload,
          signature: signedPayload.signature
        }
      })
      measurementPlaceOrder.end()
      measurementPlaceMarketOrder.end()
      await this.handleOrderPlaced(result.data.placeStopMarketOrder)
      return result.data.placeStopMarketOrder
    } catch (e) {
      let replaceOrder = false
      if (e.message.includes(MISSING_NONCES)) {
        replaceOrder = true
        await this.updateTradedAssetNonces()
      } else if (e.message.includes(MAX_ORDERS_REACHED)) {
        if (this.clientOpts.autoSignState && !this.signStateInProgress) {
          replaceOrder = true
          await this.getSignAndSyncStates()
        }
      }
      if (replaceOrder) {
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

  private handleOrderPlaced = async (order: OrderPlaced): Promise<void> => {
    if (
      this.clientOpts.autoSignState &&
      order.ordersTillSignState < ORDERS_REMAINING_TO_AUTOSYNC_AT &&
      !this.signStateInProgress
    ) {
      // console.info('Will auto sign state: ', order.ordersTillSignState)
      await this.getSignAndSyncStates()
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

  private getBlockchainFees = async (
    blockchain: Blockchain
  ): Promise<BlockchainFees> => {
    try {
      const getFeesResult = await this.gql.query<{
        getBlockchainFees: BlockchainFees
      }>({
        query: GET_BLOCKCHAIN_FEES,
        variables: {
          blockchain
        }
      })
      return getFeesResult.data.getBlockchainFees
    } catch (e) {
      console.error('Could not get blockchain fees: ', e)
      return null
    }
  }

  public async transferToExternal(params: {
    quantity: CurrencyAmount
    address: string
  }): Promise<{ txId: string; gasUsed?: CurrencyAmount }> {
    this.requireMPC()
    const {
      quantity: { currency },
      address
    } = params
    let transactionFee: CurrencyAmount
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
          `We can't infer blockchain type from address ${address}. If you think this is an error please report it.`
        )
      }
      if (addrBlockchain !== blockchain) {
        throw new Error(
          `You are attempted to send a ${blockchain} asset, but address is infered to be ${addrBlockchain}`
        )
      }
    }
    const blockchainFees = await this.getBlockchainFees(
      blockchain.toUpperCase() as Blockchain
    )
    const childKey = this.apiKey.child_keys[
      BLOCKCHAIN_TO_BIP44[blockchain.toUpperCase() as Blockchain]
    ]
    const fromAddress = childKey.address
    let preparedMovement: PrepareMovementData['prepareMovement']
    const prepareAMovement = async () => {
      const prepareParams = {
        address: fromAddress,
        backendGeneratedPayload: true,
        gasPrice: blockchainFees.priceMedium,
        quantity: params.quantity,
        targetAddress: address,
        type: 'TRANSFER' as MovementType
      }
      preparedMovement = await this.prepareMovement(prepareParams)
    }
    await prepareAMovement()

    transactionFee = preparedMovement.fees
    let signedAddMovementPayload: PayloadSignature
    let addMovementResult: GQLResp<{
      addMovement: AddMovement
    }>
    signedAddMovementPayload = await this.signPayload({
      payload: {
        address: childKey.address,
        backendGeneratedPayload: true,
        nonce: preparedMovement.nonce,
        quantity: params.quantity,
        targetAddress: address,
        type: 'TRANSFER' as MovementType,
        // eslint-disable-next-line @typescript-eslint/camelcase
        recycled_orders: preparedMovement.recycledOrders.map(
          ({ blockchain: orderBlockchain, message }) => ({
            blockchain: orderBlockchain,
            message
          })
        ),
        digests: preparedMovement.transactionElements.map(
          ({
            blockchain: txBlockchain,
            digest: digest,
            payload: payload,
            payloadHash: payloadHash,
            payloadHashFunction: payloadHashFunction
          }) => ({
            blockchain: txBlockchain,
            digest,
            payload,
            payloadHash,
            payloadHashFunction
          })
        ),
        timestamp: new Date().getTime()
      },
      kind: SigningPayloadID.addMovementPayload
    })

    const sanitizedPayload = sanitizeAddMovementPayload(
      signedAddMovementPayload.signedPayload as never
    )
    try {
      addMovementResult = await this.gql.mutate<{
        addMovement: AddMovement
      }>({
        mutation: ADD_MOVEMENT_MUTATION,
        variables: {
          payload: sanitizedPayload,
          signature: signedAddMovementPayload.signature
        }
      })
      return {
        txId: addMovementResult.data.addMovement.transactionHash,
        gasUsed: transactionFee
      }
    } catch (e) {
      console.info('Could not transfer to external ', e)
      throw e
    }
  }

  public depositToTradingContract(
    quantity: CurrencyAmount,
    feeLevel: 'low' | 'medium' | 'high' = 'medium'
  ) {
    return this.transferToTradingContract(
      quantity,
      MovementTypeDeposit,
      feeLevel
    )
  }

  public withdrawFromTradingContract(
    quantity: CurrencyAmount,
    feeLevel: 'low' | 'medium' | 'high' = 'medium'
  ) {
    return this.transferToTradingContract(
      quantity,
      MovementTypeWithdrawal,
      feeLevel
    )
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

  private transferToTradingContract(
    quantity: CurrencyAmount,
    movementType: typeof MovementTypeDeposit | typeof MovementTypeWithdrawal,
    feeLevel: 'low' | 'medium' | 'high' = 'medium'
  ): Promievent<{ txId: string; movementId: string }> {
    const promise = new Promievent((resolve, reject) =>
      this._transferToTradingContract(
        quantity,
        movementType,
        feeLevel,
        (...args) => promise.emit(...args)
      )
        .then(resolve)
        .catch(reject)
    )

    return promise
  }

  public async isMovementCompleted(movementId: string): Promise<boolean> {
    const movement = await this.getMovement(movementId)
    return movement.status === MovementStatus.COMPLETED
  }

  private async _transferToTradingContract(
    quantity: CurrencyAmount,
    movementType: typeof MovementTypeDeposit | typeof MovementTypeWithdrawal,
    feeLevel: 'low' | 'medium' | 'high',
    emit: Promievent<any>['emit']
  ): Promise<{ txId: string; movementId: string }> {
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
    const address = childKey.address

    if (
      blockchain === 'eth' &&
      movementType === MovementTypeDeposit &&
      quantity.currency !== CryptoCurrency.ETH
    ) {
      await this.approveAndAwaitAllowance(
        quantity,
        this.opts.ethNetworkSettings.contracts.vault.contract
      )
    }

    const blockchainFees = await this.getBlockchainFees(
      blockchain.toUpperCase() as Blockchain
    )

    const bnAmount = new BigNumber(quantity.amount)

    let gasPrice = blockchainFees.priceMedium
    switch (feeLevel) {
      case 'low':
        gasPrice = blockchainFees.priceLow
        break
      case 'high':
        gasPrice = blockchainFees.priceHigh
        break
    }

    let preparedMovement: PrepareMovementData['prepareMovement']
    let movementAmount = bnAmount
    const prepareAMovement = async () => {
      const params = {
        address,
        backendGeneratedPayload: true,
        gasPrice,
        quantity: {
          amount: bnAmount.toFormat(
            8,
            BigNumber.ROUND_FLOOR,
            BIG_NUMBER_FORMAT
          ),
          currency: assetData.symbol
        },
        type: movementType
      }
      preparedMovement = await this.prepareMovement(params)
      movementAmount = bnAmount
      if (
        quantity.currency === CryptoCurrency.BTC &&
        movementType === MovementTypeWithdrawal
      ) {
        const withdrawalFee = new BigNumber(preparedMovement.fees.amount)
        movementAmount = bnAmount.plus(withdrawalFee)
      }
    }

    await prepareAMovement()

    let signedAddMovementPayload: PayloadSignature
    let addMovementResult: GQLResp<{
      addMovement: AddMovement
    }>
    while (true) {
      signedAddMovementPayload = await this.signPayload({
        payload: {
          address,
          backendGeneratedPayload: true,
          nonce: preparedMovement.nonce,
          quantity: {
            amount: movementAmount.toFormat(
              8,
              BigNumber.ROUND_FLOOR,
              BIG_NUMBER_FORMAT
            ),
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
            ({
              blockchain: txBlockchain,
              digest: digest,
              payload: payload,
              payloadHash: payloadHash,
              payloadHashFunction: payloadHashFunction
            }) => ({
              blockchain: txBlockchain,
              digest,
              payload,
              payloadHash,
              payloadHashFunction
            })
          ),
          timestamp: new Date().getTime()
        },
        kind: SigningPayloadID.addMovementPayload
      })

      const sanitizedPayload = sanitizeAddMovementPayload(
        signedAddMovementPayload.signedPayload as never
      )

      try {
        addMovementResult = await this.gql.mutate<{
          addMovement: AddMovement
        }>({
          mutation: ADD_MOVEMENT_MUTATION,
          variables: {
            payload: sanitizedPayload,
            signature: signedAddMovementPayload.signature
          }
        })
        emit('movement', addMovementResult.data.addMovement)
        emit('signature', signedAddMovementPayload)
        break
      } catch (e) {
        if (!e.message.startsWith('GraphQL error: ')) {
          throw e
        }
        const blockchainError = e.message.slice(
          'GraphQL error: '.length
        ) as BlockchainError
        switch (blockchainError) {
          case BlockchainError.PREPARE_MOVEMENT_MUST_BE_CALLED_FIRST:
          case BlockchainError.BAD_NONCE:
            // console.log('preparing movement again')
            await sleep(15000)
            await prepareAMovement()
            break
          default:
            throw e
        }
      }
    }
    if (quantity.currency === CryptoCurrency.BTC) {
      return {
        txId: addMovementResult.data.addMovement.id.toString(),
        movementId: addMovementResult.data.addMovement.id.toString()
      }
    }

    const signedUpdateMovementPayload = await this.signPayload({
      payload: {
        digests: addMovementResult.data.addMovement.transactionElements.map(
          ({
            blockchain: txBlockchain,
            digest: digest,
            payload: payload,
            payloadHash: payloadHash,
            payloadHashFunction: payloadHashFunction
          }) => ({
            blockchain: txBlockchain,
            digest,
            payload,
            payloadHash,
            payloadHashFunction
          })
        ),
        movementId: addMovementResult.data.addMovement.id,
        timestamp: new Date().getTime()
      },
      kind: SigningPayloadID.updateMovementPayload
    })
    const sanitizedUpdateMovementPayload = sanitizeAddMovementPayload(
      signedUpdateMovementPayload.signedPayload as never
    )

    try {
      const updateResult = await this.gql.mutate<{
        updateMovement: UpdateMovementData
      }>({
        mutation: UPDATE_MOVEMENT_MUTATION,
        variables: {
          payload: sanitizedUpdateMovementPayload,
          signature: signedUpdateMovementPayload.signature
        }
      })

      return {
        txId: updateResult.data.updateMovement.transactionHash,
        movementId: addMovementResult.data.addMovement.id
      }
    } catch (e) {
      console.error('Could not update movement: ', e)
    }
    return null
  }

  public approveAndAwaitAllowance = async (
    amount: CurrencyAmount,
    targetAddress: string,
    feeLevel: 'low' | 'med' | 'high' = 'med'
  ): Promise<boolean> => {
    const assetData = this.assetData[amount.currency]
    const blockchain = assetData.blockchain.toUpperCase() as Blockchain
    const childKey = this.apiKey.child_keys[BLOCKCHAIN_TO_BIP44[blockchain]]
    const address = childKey.address

    const blockchainFees = await this.getBlockchainFees(
      blockchain.toUpperCase() as Blockchain
    )

    let gasPrice = blockchainFees.priceMedium
    switch (feeLevel) {
      case 'low':
        gasPrice = blockchainFees.priceLow
        break
      case 'high':
        gasPrice = blockchainFees.priceHigh
        break
    }

    const approveParams: InputApproveTransaction = {
      minimumQuantity: {
        amount: new BigNumber(ACCEPTABLE_APPROVAL, 16).toString(),
        assetHash: assetData.hash,
        blockchain
      },
      quantity: {
        amount: new BigNumber(UNLIMITED_APPROVAL, 16).toString(),
        assetHash: assetData.hash,
        blockchain
      },
      targetAddress: targetAddress.replace('0x', '')
    }

    const prepareParams: PrepareTransactionParams = {
      address,
      approve: approveParams,
      blockchain,
      gasPrice,
      timestamp: new Date().getTime()
    }

    const sendPrepare = async (
      params: PrepareTransactionParams
    ): Promise<PrepareTransactionResponse> => {
      params.timestamp = new Date().getTime()

      const signedPrepareTx = await this.signPayload({
        payload: prepareParams,
        kind: SigningPayloadID.prepareTransactionPayload
      })
      try {
        const prepareTxResult = await this.gql.mutate({
          mutation: PREPARE_TRANSATION_MUTATION,
          variables: {
            payload: signedPrepareTx.payload,
            signature: signedPrepareTx.signature
          }
        })
        return {
          ...prepareTxResult.data.prepareTransaction,
          approvalNeeded: true
        }
      } catch (e) {
        if (
          e.message.includes(
            'Specified minimum amount to approve is already covered by current allowance'
          )
        ) {
          return {
            reference: '',
            transaction: null,
            transactionElements: [],
            approvalNeeded: false
          }
        }
        throw e
      }
    }

    const prepareResult = await sendPrepare(prepareParams)
    if (!prepareResult.approvalNeeded) {
      return true
    }

    const signedIteratePayload = await this.signPayload({
      payload: {
        reference: prepareResult.reference,
        transactionElements: prepareResult.transactionElements,
        timestamp: new Date().getTime()
      },
      kind: SigningPayloadID.iterateTransactionPayload
    })

    const iterateTxResult = await this.gql.mutate({
      mutation: ITERATE_TRANSATION_MUTATION,
      variables: {
        payload: signedIteratePayload.payload,
        signature: signedIteratePayload.signature
      }
    })

    if (
      iterateTxResult.data.iterateTransaction &&
      iterateTxResult.data.iterateTransaction.transactionElements.length === 0
    ) {
      let result = prepareResult
      while (result.approvalNeeded) {
        await sleep(10000)
        result = await sendPrepare(prepareParams)
      }
      return true
    }

    return false
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
  ): Promise<PayloadSignature> {
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
  ): Promise<PayloadSignature> {
    const m = this.perfClient.start('signPayloadMpc')
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
    m.end()
    return out
  }
  private async signPayloadFull(
    payloadAndKind: PayloadAndKind
  ): Promise<PayloadSignature> {
    const m = this.perfClient.start('signPayload')
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
    m.end()
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

  public async sendBlockchainRawTransaction(params: {
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

  /*
    Updates for placing or cancelling multiple orders in same request
  */

  /**
   * Cancel a list of orders by ID.
   *
   * @param orderID[]
   * @returns
   *
   * Example
   * ```
   * const cancelledOrders = await nash.cancelOrder(['11','12'])
   * console.log(cancelledOrders)
   * ```
   */
  public async cancelOrders(
    orderIDs: string[],
    marketName: string
  ): Promise<CancelledOrder[]> {
    if (orderIDs.length === 0) {
      return []
    }

    const [a, b] = marketName.split('_')
    await this.prefillRPoolIfNeededForAssets(
      a as CryptoCurrency,
      b as CryptoCurrency
    )

    const cancelOrdersPayloads = await Promise.all(
      orderIDs.map(async id => {
        const cancelOrderParams = createCancelOrderParams(id, marketName)
        const signedPayload = await this.signPayload(cancelOrderParams)
        return signedPayload
      })
    )

    const names = this.generateNames(cancelOrdersPayloads.length)

    const params = names
      .map(name => `$p${name}:CancelOrderParams!, $s${name}:Signature!`)
      .join(',')
    const aliases = names
      .map(
        name =>
          `  ${name}: cancelOrder(payload: $p${name}, signature: $s${name}) { orderId }`
      )
      .join('\n')
    const mutationStr = `mutation cancelOrders(${params}) {\n${aliases}\n}`
    const mutation = gqlstring(mutationStr)
    const variables = {}
    cancelOrdersPayloads.forEach((item, index) => {
      variables[`p${names[index]}`] = item.payload
      variables[`s${names[index]}`] = item.signature
    })
    const result = await this.gql.mutate({
      mutation,
      variables
    })
    const cancelledOrders = Object.keys(result.data).map(
      k => result.data[k]
    ) as CancelledOrder[]
    return cancelledOrders
  }

  public async placeLimitOrders(
    params: PlaceLimitOrderParams[]
  ): Promise<OrdersPlaced> {
    if (params.length === 0) {
      return {
        orders: []
      }
    }
    await this.prefillRPoolIfNeededForAssets(
      params[0].limitPrice.currencyA,
      params[0].limitPrice.currencyB
    )

    const placeLimitOrderPayloads = await this.generatePlaceOrdersParams(params)
    const names = this.generateNames(placeLimitOrderPayloads.length)

    const paramNames = names
      .map(name => `$p${name}:PlaceLimitOrderParams!, $s${name}:Signature!`)
      .join(',')
    const aliases = names
      .map(
        name =>
          `  ${name}: placeLimitOrder(affiliateDeveloperCode: $affiliateDeveloperCode, payload: $p${name}, signature: $s${name}) {\n  id\n  status\n  ordersTillSignState\n }`
      )
      .join('\n')
    const mutationStr = `mutation placeLimitOrders($affiliateDeveloperCode: AffiliateDeveloperCode, ${paramNames}) {\n${aliases}\n}`
    const mutation = gqlstring(mutationStr)

    const variables = {
      affiliateDeveloperCode: this.affiliateDeveloperCode
    }

    placeLimitOrderPayloads.forEach((item, index) => {
      variables[`p${names[index]}`] = item.signedPayload
      variables[`s${names[index]}`] = item.signature
    })

    try {
      const result = await this.gql.mutate({
        mutation,
        variables
      })

      return {
        orders: Object.keys(result.data).map(
          k => result.data[k]
        ) as OrderPlaced[]
      }
    } catch (e) {
      if (e.message.includes(MISSING_NONCES)) {
        await this.updateTradedAssetNonces()
      }
      return {
        error: e,
        orders: []
      }
    }
  }

  /**
   * Cancel a list of orders by ID.
   *
   * @param orderID[]
   * @returns
   *
   * Example
   * ```
   * const cancelledOrders = await nash.cancelOrder(['11','12'])
   * console.log(cancelledOrders)
   * ```
   */
  public async cancelAndPlaceOrders(
    orderIDs: string[],
    marketName: string,
    orders: PlaceLimitOrderParams[]
  ): Promise<OrdersCancelledAndPlaced> {
    const [a, b] = marketName.split('_')
    await this.prefillRPoolIfNeededForAssets(
      a as CryptoCurrency,
      b as CryptoCurrency
    )

    const cancelOrdersPayloads = await Promise.all(
      orderIDs.map(async id => {
        const cancelOrderParams = createCancelOrderParams(id, marketName)
        const signedPayload = await this.signPayload(cancelOrderParams)
        return signedPayload
      })
    )

    const placeLimitOrderPayloads = await this.generatePlaceOrdersParams(orders)

    const cancelNames = this.generateNames(cancelOrdersPayloads.length)
    const cancelParams = cancelNames
      .map(name => `$p${name}:CancelOrderParams!, $s${name}:Signature!`)
      .join(',')
    const cancelAliases = cancelNames
      .map(
        name =>
          `  ${name}: cancelOrder(payload: $p${name}, signature: $s${name}) { orderId }`
      )
      .join('\n')

    const placeNames = this.generateNames(
      orders.length,
      cancelOrdersPayloads.length
    )

    const placeOrderParams = placeNames
      .map(name => `$p${name}:PlaceLimitOrderParams!, $s${name}:Signature!`)
      .join(',')
    const placeOrderAliases = placeNames
      .map(
        name =>
          `  ${name}: placeLimitOrder(affiliateDeveloperCode: $affiliateDeveloperCode, payload: $p${name}, signature: $s${name}) {\n  id\n  status\n  ordersTillSignState\n }`
      )
      .join('\n')

    const mutationStr = `mutation cancelAndPlaceOrders(${cancelParams}, ${placeOrderParams}${
      placeLimitOrderPayloads.length
        ? ', $affiliateDeveloperCode: AffiliateDeveloperCode'
        : ''
    }) {\n${cancelAliases}\n${placeOrderAliases}\n}`
    const mutation = gqlstring(mutationStr)

    const variables: any = {}
    if (placeLimitOrderPayloads.length > 0) {
      variables.affiliateDeveloperCode = this.affiliateDeveloperCode
    }

    cancelOrdersPayloads.forEach((item, index) => {
      variables[`p${cancelNames[index]}`] = item.payload
      variables[`s${cancelNames[index]}`] = item.signature
    })
    placeLimitOrderPayloads.forEach((item, index) => {
      variables[`p${placeNames[index]}`] = item.signedPayload
      variables[`s${placeNames[index]}`] = item.signature
    })

    try {
      const result = await this.gql.mutate({
        mutation,
        variables
      })
      return {
        orders: Object.keys(result.data)
          .filter(k => placeNames.indexOf(k) > -1)
          .map(k => result.data[k]) as OrderPlaced[],
        cancelled: Object.keys(result.data)
          .filter(k => cancelNames.indexOf(k) > -1)
          .map(k => result.data[k]) as CancelledOrder[]
      }
    } catch (e) {
      if (e.message.includes(MISSING_NONCES)) {
        await this.updateTradedAssetNonces()
      }
      return {
        error: e,
        orders: [],
        cancelled: []
      }
    }
  }

  private generatePlaceOrdersParams = async (
    params: PlaceLimitOrderParams[]
  ): Promise<PayloadSignature[]> => {
    return await Promise.all(
      params.map(async param => {
        const { nonceOrder, noncesFrom, noncesTo } = this.getNoncesForTrade(
          param.marketName,
          param.buyOrSell
        )
        const normalizedAmount = normalizeAmountForMarket(
          param.amount,
          this.marketData[param.marketName]
        )
        const normalizedLimitPrice = normalizePriceForMarket(
          param.limitPrice,
          this.marketData[param.marketName]
        )
        const placeLimitOrderParams = createPlaceLimitOrderParams(
          param.allowTaker,
          normalizedAmount,
          param.buyOrSell,
          param.cancellationPolicy,
          normalizedLimitPrice,
          param.marketName,
          noncesFrom,
          noncesTo,
          nonceOrder,
          param.cancelAt
        )
        const signedPayload = await this.signPayload(placeLimitOrderParams)
        return signedPayload
      })
    )
  }

  private generateNames = (total: number, offset: number = 0): string[] => {
    const names = [
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
      'K',
      'L',
      'M',
      'N',
      'O',
      'P',
      'Q'
    ]

    return names.slice(offset, offset + total)
  }
}
