import * as AbsintheSocket from '@absinthe/socket'
import { Socket as PhoenixSocket } from 'phoenix-channels'
import { PerfClient } from '@neon-exchange/nash-perf'
import setCookie from 'set-cookie-parser'
import fetch from 'node-fetch'
import toHex from 'array-buffer-to-hex'
import https from 'https'
import http from 'http'
import * as NeonJS from '@cityofzion/neon-js'
import Promievent from 'promievent'
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
  UpdateMovementData,
  UpdateMovementVariables
} from '../mutations/movements/updateMovement'
import { AddMovement } from '../mutations/movements/fragments/addMovementFragment'
import {
  GET_ACCOUNT_PORTFOLIO,
  GetAccountPortfolioParams
} from '../queries/account/getAccountPortfolio'
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

import {
  checkMandatoryParams,
  detectBlockchain,
  findBestNetworkNode,
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
  SignMovementResult,
  Blockchain as TSAPIBlockchain,
  AssetData,
  Asset,
  MissingNonceError,
  InsufficientFundsError
} from '../types'
import {
  ClientMode,
  GQL,
  NashSocketEvents,
  GQLResp,
  PayloadSignature
} from '../types/client'
import { BlockchainError } from './movements'
import { gqlToString } from './queryPrinter'
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
  createPrepareMovementParams,
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

import {
  prefixWith0xIfNeeded,
  setEthSignature,
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
  P2shP2wpkhScript,
  getHashAndSighashType
} from './btcUtils'
export * from './environments'
import {
  EnvironmentConfig,
  ClientOptions,
  EnvironmentConfiguration
} from './environments'
const WebSocket = require('websocket').w3cwebsocket

const BLOCKCHAIN_TO_BIP44 = {
  [Blockchain.ETH]: BIP44.ETH,
  [Blockchain.BTC]: BIP44.BTC,
  [Blockchain.NEO]: BIP44.NEO
}

const ORDERS_REMAINING_TO_AUTOSYNC_AT = 20
const NEP5_OLD_ASSETS = ['nos', 'phx', 'guard', 'lx', 'ava']
export const MISSING_NONCES = 'missing_asset_nonces'
export const MAX_ORDERS_REACHED = 'Maximal number of orders have been reached'
export const MAX_SIGN_STATE_RECURSION = 5

export class Client {
  public perfClient: PerfClient
  private connection: NashSocketEvents
  private mode: ClientMode = ClientMode.NONE
  public ethVaultContract: Contract
  public apiKey: APIKey
  private maxEthCostPrTransaction: BigNumber
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

  private initParams: InitParams
  private nashCoreConfig: Config
  private casCookie: string
  private publicKey: string
  private account?: SignInResult['signIn']['account']

  private wsToken: string
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
  private signStateInProgress: boolean
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
      autoSignState: true,
      runRequestsOverWebsockets: false,
      headers: {},
      ...clientOpts
    }
    this.isMainNet = this.opts.host === EnvironmentConfiguration.production.host
    this.web3 = new Web3(this.opts.ethNetworkSettings.nodes[0])

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
    const query: GQL['query'] = async params => {
      let obj: GQLResp<any>

      if (this.clientOpts.runRequestsOverWebsockets) {
        obj = await new Promise((resolve, reject) =>
          AbsintheSocket.observe(
            this.connection.absintheSocket,
            AbsintheSocket.send(this.connection.absintheSocket, {
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
      } else {
        const resp = await fetch(this.apiUri, {
          method: 'POST',
          headers: this.headers,
          agent,
          body: JSON.stringify({
            query: gqlToString(params.query),
            variables: params.variables
          })
        })
        if (resp.status !== 200) {
          let msg = `API error. Status code: ${resp.status}`
          if (resp.body) {
            msg += ` / body: ${resp.body.toString()}`
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

  private _socket = null
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
    socket._users = 0

    // The disconnect event is implemented incorrectly
    // as it does not trigger the correct events.
    //
    // This implementation triggers the correct events
    socket.disconnect = (c, code, reason) => {
      socket._users -= 1
      if (!socket.conn) {
        if (socket === this._socket) {
          this._socket = null
        }
        if (c) {
          c()
        }
        return
      }

      if (socket._users > 0) {
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

    return socket
  }

  private getSocket() {
    if (this._socket != null) {
      this._socket._users += 1
      return this._socket
    }
    this._socket = this._createSocket()
    this._socket._users = 1

    this._socket.onClose(() => {
      this._socket = null
    })
    return this._socket
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
    const socket = this.getSocket()
    const absintheSocket = AbsintheSocket.create(socket)
    let disconnected = false
    return {
      socket,
      absintheSocket,
      disconnect: () => {
        if (disconnected) {
          return
        }
        disconnected = true
        socket.disconnect()
      },
      onUpdatedAccountOrders: async (payload, handlers) => {
        authCheck('onUpdatedAccountOrders')
        AbsintheSocket.observe(
          absintheSocket,
          AbsintheSocket.send(absintheSocket, {
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
          absintheSocket,
          AbsintheSocket.send(absintheSocket, {
            operation: gqlToString(UPDATED_CANDLES),
            variables
          }),
          handlers
        ),
      onUpdatedTickers: handlers => {
        AbsintheSocket.observe(
          absintheSocket,
          AbsintheSocket.send(absintheSocket, {
            operation: gqlToString(UPDATED_TICKERS),
            variables: {}
          }),
          handlers
        )
      },
      onNewTrades: (variables, handlers) => {
        AbsintheSocket.observe(
          absintheSocket,
          AbsintheSocket.send(absintheSocket, {
            operation: gqlToString(NEW_TRADES),
            variables
          }),
          handlers
        )
      },
      onUpdatedOrderbook: (variables, handlers) => {
        AbsintheSocket.observe(
          absintheSocket,
          AbsintheSocket.send(absintheSocket, {
            operation: gqlToString(UPDATED_ORDER_BOOK),
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
    this._socket = null
    if (this.clientOpts.runRequestsOverWebsockets) {
      this.connection.socket.disconnect()
      this.connection = this.createSocketConnection()
    }
    this.apiKey = JSON.parse(Buffer.from(secret, 'base64').toString('utf-8'))
    this._headers = {
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
  }: LegacyLoginParams): Promise<void> {
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
    if (m != null) {
      this.wsToken = m[1]
      this._socket = null
      if (this.clientOpts.runRequestsOverWebsockets) {
        this.connection.socket.disconnect()
        this.connection = this.createSocketConnection()
      }
    }
    if (resp.errors) {
      throw new Error(resp.errors[0].message)
    }

    this.account = resp.data.signIn.account
    this.marketData = await this.fetchMarketData()
    this.assetData = await this.fetchAssetData()
    this.assetNonces = {}
    this.currentOrderNonce = this.createTimestamp32()
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
      console.log(
        'keys not present in the CAS: creating and uploading as we speak.'
      )

      await this.createAndUploadKeys(keys.encryptionKey, presetWallets)
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
    presetWallets?: object
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
      assetData: this.assetData
    }

    this.nashCoreConfig = await initialize(this.initParams)

    if (presetWallets !== undefined) {
      const cloned: any = { ...this.nashCoreConfig }
      cloned.wallets = presetWallets
      this.nashCoreConfig = cloned
    }

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
      console.info('Will auto sign state: ', order.ordersTillSignState)
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

  /**
   * Used by our internal trading bot
   * @param  {string}                      address
   * @param  {CurrencyAmount}              quantity
   * @param  {MovementType}                type
   * @return {Promise<SignMovementResult>}
   */
  public async legacyAddMovement(
    address: string,
    quantity: CurrencyAmount,
    type: MovementType
  ): Promise<SignMovementResult> {
    this.requireFull()
    const prepareMovementMovementParams = createPrepareMovementParams(
      address,
      quantity,
      type
    )

    const preparePayload = await this.signPayload(prepareMovementMovementParams)
    const result = await this.gql.mutate({
      mutation: PREPARE_MOVEMENT_MUTATION,
      variables: {
        payload: preparePayload.payload,
        signature: preparePayload.signature
      }
    })

    const movementPayloadParams = createAddMovementParams(
      address,
      quantity,
      type,
      result.data.prepareMovement.nonce,
      null,
      result.data.prepareMovement.recycledOrders,
      result.data.prepareMovement.transactionElements
    )

    const signedMovement = await this.signPayload(movementPayloadParams)
    const payload = { ...signedMovement.payload }
    payload.signedTransactionElements =
      signedMovement.signedPayload.signed_transaction_elements
    payload.resignedOrders = payload.recycled_orders
    delete payload.digests
    delete payload.recycled_orders
    delete payload.blockchainSignatures

    const addMovementResult = await this.gql.mutate({
      mutation: ADD_MOVEMENT_MUTATION,
      variables: {
        payload,
        signature: signedMovement.signature
      }
    })

    // after deposit or withdrawal we want to update nonces
    await this.updateTradedAssetNonces()

    return {
      result: addMovementResult.data.addMovement,
      blockchain_data: signedMovement.blockchain_data
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
    for (let i = 0; i < 5; i++) {
      try {
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
        setEthSignature(approveTx, approveSignature)
        const p = await this.web3.eth.sendSignedTransaction(
          '0x' + approveTx.serialize().toString('hex')
        )
        return p
      } catch (e) {
        if (
          e.message === 'Returned error: replacement transaction underpriced'
        ) {
          // console.log('approve failed, retrying approve in 15 seconds')
          await sleep(15000)
          continue
        }
        throw e
      }
    }
    throw new Error('Failed to approve erc20 token')
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
        setEthSignature(ethTx, ethTxSignature)
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

  private async updateMovement(
    payload: Omit<UpdateMovementVariables['payload'], 'timestamp'>
  ): Promise<UpdateMovementData['updateMovement']> {
    const signature = await this.signPayload({
      kind: SigningPayloadID.updateMovementPayload,
      payload: {
        ...payload,
        timestamp: new Date().getTime()
      }
    })

    const data = await this.gql.mutate<
      UpdateMovementData,
      UpdateMovementVariables
    >({
      mutation: UPDATE_MOVEMENT_MUTATION,
      variables: {
        payload: signature.payload as UpdateMovementVariables['payload'],
        signature: signature.signature
      }
    })

    return data.data.updateMovement
  }

  private transferToTradingContract(
    quantity: CurrencyAmount,
    movementType: typeof MovementTypeDeposit | typeof MovementTypeWithdrawal
  ): Promievent<{ txId: string; movementId: string }> {
    const promise = new Promievent((resolve, reject) =>
      this._transferToTradingContract(quantity, movementType, (...args) =>
        promise.emit(...args)
      )
        .then(resolve)
        .catch(reject)
    )

    return promise
  }

  public async isMovementCompleted(movementId: string): Promise<boolean> {
    return (
      (await this.getMovement((movementId as never) as number)).status ===
      MovementStatus.COMPLETED
    )
  }

  private async _transferToTradingContract(
    quantity: CurrencyAmount,
    movementType: typeof MovementTypeDeposit | typeof MovementTypeWithdrawal,
    emit: Promievent<any>['emit']
  ): Promise<{ txId: string; movementId: string }> {
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

    const address = childKey.address
    const bnAmount = new BigNumber(quantity.amount)

    let preparedMovement: PrepareMovementData['prepareMovement']
    let movementAmount = bnAmount
    const prepareAMovement = async () => {
      preparedMovement = await this.prepareMovement({
        address,
        quantity: {
          amount: bnAmount.toFormat(8),
          currency: assetData.symbol
        },
        type: movementType
      })

      movementAmount = bnAmount
      if (
        quantity.currency === CryptoCurrency.BTC &&
        movementType === MovementTypeWithdrawal
      ) {
        const withdrawalFee = new BigNumber(preparedMovement.fees.amount)
        movementAmount = bnAmount.plus(withdrawalFee)
      }
    }

    while (true) {
      try {
        await prepareAMovement()
        break
      } catch (e) {
        if (!e.message.startsWith('GraphQL error: ')) {
          throw e
        }
        const blockchainError = e.message.slice(
          'GraphQL error: '.length
        ) as BlockchainError
        switch (blockchainError) {
          case BlockchainError.MISSING_SIGNATURES:
          case BlockchainError.BLOCKCHAIN_BALANCE_OUT_OF_SYNC:
            // console.log('sync states and retry in 15 seconds')
            await this.getSignAndSyncStates(true)
            await sleep(15000)
            break
          case BlockchainError.WAITING_FOR_BALANCE_SYNC:
            // console.log('waiting for balance sync, retrying in 15 seconds')
            await sleep(15000)
            break
          case BlockchainError.MOVEMENT_ALREADY_IN_PROGRESS:
            // console.log('movement in progress, retrying in 15 seconds')
            await sleep(15000)
            break
          default:
            throw e
        }
      }
    }

    let signedAddMovementPayload: PayloadSignature
    let addMovementResult: GQLResp<{
      addMovement: AddMovement
    }>
    while (true) {
      signedAddMovementPayload = await this.signPayload({
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
          case BlockchainError.MOVEMENT_ALREADY_IN_PROGRESS:
          case BlockchainError.WAITING_FOR_BALANCE_SYNC:
            // console.log('waiting for balance sync, retrying in 15 seconds')
            await sleep(15000)
            break
          case BlockchainError.MISSING_SIGNATURES:
          case BlockchainError.BLOCKCHAIN_BALANCE_OUT_OF_SYNC:
            // console.log('sync states and retry in 15 seconds')
            await this.getSignAndSyncStates(true)
            await prepareAMovement()
            await sleep(15000)
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

    const blockchainSignature = await this.completePayloadSignature({
      blockchain: blockchain.toUpperCase() as Blockchain,
      payload: signedAddMovementPayload.blockchain_raw.toLowerCase(),
      public_key: childKey.public_key,
      signature: signedAddMovementPayload.blockchain_data.userSig,
      type: CompletePayloadSignatureType.Movement,
      r: signedAddMovementPayload.blockchain_data.r
    })

    emit('blockchainSignature', blockchainSignature)

    const resp = await this.updateDepositWithdrawalMovementWithTx({
      blockchainSignature,
      movement: addMovementResult.data.addMovement,
      signedAddMovementPayload
    })
    return {
      txId: resp.txId,
      movementId: addMovementResult.data.addMovement.id
    }
  }

  public async findPendingChainMovements(
    chain: TSAPIBlockchain
  ): Promise<Movement[]> {
    return (await this.listMovements({
      status: MovementStatus.PENDING
    })).filter(movement => {
      return (
        this.assetData[movement.currency] != null &&
        this.assetData[movement.currency].blockchain === chain
      )
    })
  }

  public resumeTradingContractTransaction(unfinishedTransaction: {
    movement: Movement
    signature: PayloadSignature
    blockchainSignature: string
  }): Promievent<{ txId: string }> {
    let resolve
    let reject
    const out = new Promievent<any>((a, b) => {
      resolve = a
      reject = b
    })

    this._resumeVaultTransaction(unfinishedTransaction, out.emit.bind(out))
      .then(resolve)
      .catch(reject)

    return out
  }
  private async _resumeVaultTransaction(
    unfinishedTransaction: {
      movement: Movement
      signature: PayloadSignature
      blockchainSignature?: string
    },
    emit: Promievent<any>['emit']
  ): Promise<{ txId: string }> {
    const {
      movement,
      signature: signedAddMovementPayload
    } = unfinishedTransaction
    const assetData = this.assetData[movement.currency]
    const blockchain = assetData.blockchain
    const childKey = this.apiKey.child_keys[
      BLOCKCHAIN_TO_BIP44[blockchain.toUpperCase() as Blockchain]
    ]

    const blockchainSignature =
      unfinishedTransaction.blockchainSignature ||
      (await this.completePayloadSignature({
        blockchain: blockchain.toUpperCase() as Blockchain,
        payload: signedAddMovementPayload.blockchain_raw.toLowerCase(),
        public_key: childKey.public_key,
        signature: signedAddMovementPayload.blockchain_data.userSig,
        type: CompletePayloadSignatureType.Movement,
        r: signedAddMovementPayload.blockchain_data.r
      }))
    emit('blockchainSignature', blockchainSignature)
    const resp = await this.updateDepositWithdrawalMovementWithTx({
      movement,
      signedAddMovementPayload,
      blockchainSignature
    })
    return resp
  }

  private async updateDepositWithdrawalMovementWithTx({
    movement,
    signedAddMovementPayload,
    blockchainSignature
  }: {
    movement: Movement
    signedAddMovementPayload: PayloadSignature
    blockchainSignature: string
  }): Promise<{ txId: string }> {
    const movementType = movement.type
    const quantity = signedAddMovementPayload.payload.quantity as CurrencyAmount
    const bnAmount = new BigNumber(quantity.amount)
    const assetData = this.assetData[movement.currency]
    const blockchain = assetData.blockchain
    const childKey = this.apiKey.child_keys[
      BLOCKCHAIN_TO_BIP44[blockchain.toUpperCase() as Blockchain]
    ]

    switch (blockchain) {
      case 'eth':
        if (
          blockchain === TSAPIBlockchain.ETH &&
          movementType === MovementTypeDeposit &&
          quantity.currency !== CryptoCurrency.ETH
        ) {
          // console.log('approving erc02')
          await this.approveAndAwaitAllowance(
            assetData,
            childKey,
            quantity.amount
          )
        }
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
          '0x' + movement.signature
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

        setEthSignature(movementTx, invocationSignature)
        const serializedEthTx = movementTx.serialize().toString('hex')
        const hash = movementTx.hash().toString('hex')
        // const pendingEthMovements = await this.findPendingChainMovements(
        //   TSAPIBlockchain.ETH
        // )
        await new Promise((resolve, reject) => {
          const pe = this.web3.eth.sendSignedTransaction('0x' + serializedEthTx)
          pe.once('transactionHash', resolve)
          pe.once('error', reject)
        })

        await this.updateMovement({
          movementId: movement.id,
          status: MovementStatus.PENDING,
          transactionHash: hash.toLowerCase(),
          transactionPayload: serializedEthTx.toLowerCase(),
          fee: (parseInt(gasPrice, 10) * estimate * 2).toString()
        })
        return {
          txId: prefixWith0xIfNeeded(hash)
        }
      case 'neo':
        const timestamp = new BigNumber(this.createTimestamp32()).toString(16)
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
            new sc.ContractParam('ByteArray', movement.publicKey),
            new sc.ContractParam('ByteArray', blockchainSignature),
            new sc.ContractParam('ByteArray', movement.signature)
          ]
        )
        let sendingFromSmartContract = false
        const neoTransaction = new tx.InvocationTransaction({
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
          neoTransaction.addAttribute(
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
          neoTransaction.addIntent(
            quantity.currency.toUpperCase(),
            bnAmount.toNumber(),
            this.opts.neoNetworkSettings.contracts.vault.address
          )
        }
        neoTransaction
          .addAttribute(tx.TxAttrUsage.Remark, timestamp)
          .calculate(balance)
        const payload = neoTransaction.serialize(false)

        const signature = await this.signNeoPayload(payload.toLowerCase())
        neoTransaction.addWitness(
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
            neoTransaction.scripts.push(
              new tx.Witness({
                invocationScript: '0000',
                verificationScript: ''
              })
            )
          } else {
            neoTransaction.scripts.unshift(
              new tx.Witness({
                invocationScript: '0000',
                verificationScript: ''
              })
            )
          }
        }
        const signedNeoPayload = neoTransaction.serialize(true)
        await this.updateMovement({
          movementId: movement.id,
          status: MovementStatus.PENDING,
          transactionHash: neoTransaction.hash.toLowerCase(),
          transactionPayload: signedNeoPayload.toLowerCase(),
          fee: neoTransaction.fees.toString()
        })

        return {
          txId: neoTransaction.hash
        }
      default:
        throw new Error('not implemented')
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
