import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { createHttpLink } from 'apollo-link-http';
import { initializeCryptoCore } from '../utils/cryptoCore';
import { LIST_MARKETS_QUERY } from '../queries/market/listMarkets';
import { GET_MARKET_QUERY } from '../queries/market/getMarket';
import { LIST_ACCOUNT_TRANSACTIONS } from '../queries/account/listAccountTransactions';
import { LIST_ACCOUNT_ORDERS } from '../queries/order/listAccountOrders';
import { LIST_ACCOUNT_BALANCES } from '../queries/account/listAccountBalances';
import { LIST_MOVEMENTS } from '../queries/movement/listMovements';
import { GET_ACCOUNT_BALANCE } from '../queries/account/getAccountBalance';
import { GET_ACCOUNT_ORDER } from '../queries/order/getAccountOrder';
import { GET_MOVEMENT } from '../queries/movement/getMovement';
import { GET_TICKER } from '../queries/market/getTicker';
import { CANCEL_ORDER_MUTATION } from '../mutations/orders/cancelOrder';
import { LIST_CANDLES } from '../queries/candlestick/listCandles';
import { LIST_TICKERS } from '../queries/market/listTickers';
import { LIST_TRADES } from '../queries/market/listTrades';
import { GET_ORDERBOOK } from '../queries/market/getOrderBook';
import { PLACE_LIMIT_ORDER_MUTATION } from '../mutations/orders/placeLimitOrder';
import { PLACE_MARKET_ORDER_MUTATION } from '../mutations/orders/placeMarketOrder';
import { PLACE_STOP_LIMIT_ORDER_MUTATION } from '../mutations/orders/placeStopLimitOrder';
import { PLACE_STOP_MARKET_ORDER_MUTATION } from '../mutations/orders/placeStopMarketOrder';
import { SIGN_DEPOSIT_REQUEST_MUTATION } from '../mutations/movements/signDepositRequest';
import { SIGN_WITHDRAW_REQUEST_MUTATION } from '../mutations/movements/signWithdrawRequest';
import { GET_DEPOSIT_ADDRESS } from '../queries/getDepositAddress';
import { GET_ACCOUNT_PORTFOLIO } from '../queries/account/getAccountPortfolio';
import { LIST_ACCOUNT_VOLUMES } from '../queries/account/listAccountVolumes';
import { SALT } from '../config';
import { FiatCurrency } from '../constants/currency';
import {
  mapMarketsForGoClient,
  normalizePriceForMarket,
  normalizeAmountForMarket
} from '../helpers';
import {
  getSecretKey,
  encryptSecretKey
} from '@neon-exchange/nex-auth-protocol';
import toHex from 'array-buffer-to-hex';
import fetch from 'node-fetch';
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
  SignMovement,
  CancelledOrder,
  AccountBalance,
  AccountTransaction,
  OrderPlaced,
  Market,
  Order,
  DateTime,
  PayloadAndSignature,
  AccountOrder,
  OrderBuyOrSell,
  OrderCancellationPolicy,
  CurrencyAmount,
  CurrencyPrice,
  PaginationCursor,
  OrderStatus,
  OrderType
} from '../types';

import {
  createDepositRequestParams,
  createWithdrawalRequestParams,
  createPlaceStopMarketOrderParams,
  createPlaceStopLimitOrderParams,
  createPlaceMarketOrderParams,
  createPlaceLimitOrderParams,
  createCancelOrderParams,
  createGetMovementParams,
  createGetDepositAddressParams,
  createGetAccountOrderParams,
  createGetAccountBalanceParams,
  createListAccountVolumesParams,
  createAccountPortfolioParams,
  createListMovementsParams,
  createListAccountBalanceParams,
  createListAccountTransactionsParams,
  createListAccountOrdersParams,
  Config,
  CryptoCurrency,
  WrappedPayload
} from '@neon-exchange/crypto-core-ts';

/**
 * ClientOptions is used to configure and construct a new Nash API Client.
 */
export interface ClientOptions {
  apiURI: string;
  casURI: string;
  debug?: boolean;
}

export class Client {
  private opts: ClientOptions;
  private cryptoCore: any;
  private initParams: any; // make interface for this!
  private nashCoreConfig: Config;
  private account: any;
  private publicKey: string;
  private gql: ApolloClient<any>;
  public marketData: { [key: string]: Market };

  /**
   * Create a new instance of [[Client]]
   *
   * @param opts
   * @returns
   *
   * Example
   * ```
   * import { Client } from '@neon-exchange/api-client-ts'
   *
   * const nash = new Client({
   *   apiURI: 'https://pathtoapiurl',
   *   casURI: 'https://pathtocasurl',
   *   debug: true
   * })
   * ```
   */
  constructor(opts: ClientOptions) {
    this.opts = opts;
    this.gql = new ApolloClient({
      cache: new InMemoryCache(),
      link: createHttpLink({ fetch, uri: this.opts.apiURI }),
      defaultOptions: {
        watchQuery: {
          fetchPolicy: 'network-only',
          errorPolicy: 'all'
        },
        query: {
          fetchPolicy: 'network-only',
          errorPolicy: 'all'
        }
      }
    });
  }

  /**
   * Login against the central account service. A login is required for all signed
   * request.
   *
   * @param email
   * @param password
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
  public async login(email: string, password: string): Promise<boolean> {
    // As login always needs to be called at the start of any program/request
    // we initialize the crypto core right here.
    if (this.cryptoCore === undefined) {
      if (this.opts.debug) {
        console.log('loading crypto core module..');
      }
      this.cryptoCore = await initializeCryptoCore();
    } else {
      if (this.opts.debug) {
        console.log('crypto core module already loaded');
      }
    }

    const keys = await this.cryptoCore.deriveHKDFKeysFromPassword(
      password,
      SALT
    );

    const loginUrl = this.opts.casURI + '/user_login';
    const body = {
      email,
      password: keys.authenticationKey
    };

    const response = await fetch(loginUrl, {
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST'
    });
    const casCookie = response.headers.get('set-cookie');
    const result = await response.json();
    if (result.error) {
      throw new Error(result.message);
    }
    this.account = result.account;

    if (this.opts.debug) {
      console.log(this.account);
    }

    const encryptedSecretKey = this.account.encrypted_secret_key;
    const encryptedSecretKeyNonce = this.account.encrypted_secret_key_nonce;
    const encryptedSecretKeyTag = this.account.encrypted_secret_key_tag;
    this.marketData = await this.fetchMarketData();

    this.initParams = {
      chainIndices: { neo: 1, eth: 1 },
      encryptionKey: keys.encryptionKey,
      enginePubkey: 'dummy',
      passphrase: '',
      secretKey: encryptedSecretKey,
      secretNonce: encryptedSecretKeyNonce,
      secretTag: encryptedSecretKeyTag,
      marketData: mapMarketsForGoClient(this.marketData)
    };

    if (encryptedSecretKey === null) {
      if (this.opts.debug) {
        console.log(
          'keys not present in the CAS: creating and uploading as we speak.'
        );
      }
      this.initParams.chainIndices = { neo: 1, eth: 1 };
      await this.createAndUploadKeys(keys.encryptionKey, casCookie);
      return true;
    }

    this.nashCoreConfig = await this.cryptoCore.initialize(this.initParams);

    if (this.opts.debug) {
      console.log(this.nashCoreConfig);
    }

    this.publicKey = this.nashCoreConfig.PayloadSigning.PublicKey;

    return true;
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
    });
    const ticker = result.data.getTicker as Ticker;

    return ticker;
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
    });
    const orderBook = result.data.getOrderBook as OrderBook;

    return orderBook;
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
    });

    const tradeHistory = result.data.listTrades as TradeHistory;

    return tradeHistory;
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
    const result = await this.gql.query({ query: LIST_TICKERS });
    const tickers = result.data.listTickers as Ticker[];

    return tickers;
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
    });
    const candleRange = result.data.listCandles as CandleRange;

    return candleRange;
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
    const result = await this.gql.query({ query: LIST_MARKETS_QUERY });
    const markets = result.data.listMarkets as Market[];

    return markets;
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
    });
    const market = result.data.getMarket as Market;

    return market;
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
    );
    const signedPayload = await this.signPayload(listAccountOrdersParams);
    const result = await this.gql.query({
      query: LIST_ACCOUNT_ORDERS,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    });
    const accountOrder = result.data.listAccountOrders as AccountOrder;

    return accountOrder;
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
    );
    const signedPayload = await this.signPayload(listAccountTransactionsParams);

    const result = await this.gql.query({
      query: LIST_ACCOUNT_TRANSACTIONS,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    });
    const accountTransactions = result.data
      .listAccountTransactions as AccountTransaction;

    return accountTransactions;
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
    ignoreLowBalance?: boolean
  ): Promise<AccountBalance[]> {
    const listAccountBalanceParams = createListAccountBalanceParams(
      ignoreLowBalance
    );
    const signedPayload = await this.signPayload(listAccountBalanceParams);

    const result = await this.gql.query({
      query: LIST_ACCOUNT_BALANCES,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    });
    const accountBalances = result.data.listAccountBalances as AccountBalance[];

    return accountBalances;
  }

  /**
   * Get the deposit address for the given crypto currency.
   *
   * @param currency
   * @returns
   *
   * Example
   * ```
   * import { CryptoCurrency } from '@neon-exchange/api-client-ts'
   *
   * const address = await nash.getDepositAddress(CryptoCurrency.NEO)
   * console.log(address)
   * ```
   */
  public async getDepositAddress(
    currency: CryptoCurrency
  ): Promise<AccountDepositAddress> {
    const getDepositAddressParams = createGetDepositAddressParams(currency);
    const signedPayload = await this.signPayload(getDepositAddressParams);

    const result = await this.gql.query({
      query: GET_DEPOSIT_ADDRESS,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    });
    const depositAddress = result.data
      .getDepositAddress as AccountDepositAddress;

    return depositAddress;
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
    );
    const signedPayload = await this.signPayload(getAccountPortfolioParams);

    const result = await this.gql.query({
      query: GET_ACCOUNT_PORTFOLIO,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    });
    const accountPortfolio = result.data
      .getAccountPortfolio as AccountPortfolio;

    return accountPortfolio;
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
    const getMovemementParams = createGetMovementParams(movementID);
    const signedPayload = await this.signPayload(getMovemementParams);

    const result = await this.gql.query({
      query: GET_MOVEMENT,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    });
    const movement = result.data.getMovement as Movement;

    return movement;
  }

  /**
   * Get [[AccountBalance]] for the given crypto currency.
   *
   * @param currency
   * @returns
   *
   * Example
   * ```
   * import { CryptoCurrency } from '@neon-exchange/api-client-ts'
   *
   * const accountBalance = await nash.getAcountBalance(CryptoCurrency.ETH)
   * console.log(accountBalance)
   * ```
   */
  public async getAccountBalance(
    currency: CryptoCurrency
  ): Promise<AccountBalance> {
    const getAccountBalanceParams = createGetAccountBalanceParams(currency);
    const signedPayload = await this.signPayload(getAccountBalanceParams);

    const result = await this.gql.query({
      query: GET_ACCOUNT_BALANCE,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    });
    const accountBalance = result.data.getAccountBalance as AccountBalance;

    return accountBalance;
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
    const getAccountOrderParams = createGetAccountOrderParams(orderID);
    const signedPayload = await this.signPayload(getAccountOrderParams);

    const result = await this.gql.query({
      query: GET_ACCOUNT_ORDER,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    });
    const order = result.data.getAccountOrder as Order;

    return order;
  }

  /**
   * list all volumes for the current authenticated account.
   */
  public async listAccountVolumes(): Promise<AccountVolume> {
    const listAccountVolumesParams = createListAccountVolumesParams();
    const signedPayload = await this.signPayload(listAccountVolumesParams);

    const result = await this.gql.query({
      query: LIST_ACCOUNT_VOLUMES,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    });
    const accountVolumes = result.data.listAccountVolumes as AccountVolume;

    return accountVolumes;
  }

  /**
   * list all movements for the current authenticated account.
   *
   * @param currency
   * @param status
   * @param type
   */
  public async listMovements(
    currency?: CryptoCurrency,
    status?: MovementStatus,
    type?: MovementType
  ): Promise<Movement[]> {
    const listMovementParams = createListMovementsParams(
      currency,
      status,
      type
    );
    const signedPayload = await this.signPayload(listMovementParams);

    const result = await this.gql.query({
      query: LIST_MOVEMENTS,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    });
    const movements = result.data.listMovements as Movement[];

    return movements;
  }

  /**
   * cancel an order by ID.
   *
   * @param orderID
   */
  public async cancelOrder(orderID: string): Promise<CancelledOrder> {
    const cancelOrderParams = createCancelOrderParams(orderID);
    const signedPayload = await this.signPayload(cancelOrderParams);

    const result = await this.gql.mutate({
      mutation: CANCEL_ORDER_MUTATION,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    });
    const cancelledOrder = result.data.cancelOrder as CancelledOrder;

    return cancelledOrder;
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
    const normalizedAmount = normalizeAmountForMarket(
      amount,
      this.marketData[marketName]
    );
    const normalizedLimitPrice = normalizePriceForMarket(
      limitPrice,
      this.marketData[marketName]
    );
    const placeLimitOrderParams = createPlaceLimitOrderParams(
      allowTaker,
      normalizedAmount,
      buyOrSell,
      cancellationPolicy,
      normalizedLimitPrice,
      marketName,
      cancelAt
    );
    const signedPayload = await this.signPayload(placeLimitOrderParams);

    const result = await this.gql.mutate({
      mutation: PLACE_LIMIT_ORDER_MUTATION,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    });
    const orderPlaced = result.data.placeLimitOrder as OrderPlaced;

    return orderPlaced;
  }

  /**
   * Place a market order.
   *
   * @param amount
   * @param buyOrSell
   * @param marketName
   */
  public async placeMarketOrder(
    amount: CurrencyAmount,
    buyOrSell: OrderBuyOrSell,
    marketName: string
  ): Promise<OrderPlaced> {
    const normalizedAmount = normalizeAmountForMarket(
      amount,
      this.marketData[marketName]
    );
    const placeMarketOrderParams = createPlaceMarketOrderParams(
      normalizedAmount,
      buyOrSell,
      marketName
    );
    const signedPayload = await this.signPayload(placeMarketOrderParams);
    const result = await this.gql.mutate({
      mutation: PLACE_MARKET_ORDER_MUTATION,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    });
    const orderPlaced = result.data.placeMarketOrder as OrderPlaced;

    return orderPlaced;
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
    const normalizedAmount = normalizeAmountForMarket(
      amount,
      this.marketData[marketName]
    );
    const normalizedLimitPrice = normalizePriceForMarket(
      limitPrice,
      this.marketData[marketName]
    );
    const normalizedStopPrice = normalizePriceForMarket(
      stopPrice,
      this.marketData[marketName]
    );
    const placeStopLimitOrderParams = createPlaceStopLimitOrderParams(
      allowTaker,
      normalizedAmount,
      buyOrSell,
      cancellationPolicy,
      normalizedLimitPrice,
      marketName,
      normalizedStopPrice,
      cancelAt
    );
    const signedPayload = await this.signPayload(placeStopLimitOrderParams);
    const result = await this.gql.mutate({
      mutation: PLACE_STOP_LIMIT_ORDER_MUTATION,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    });
    const orderPlaced = result.data.placeStopLimitOrder as OrderPlaced;

    return orderPlaced;
  }

  /**
   * Place a stop market order.
   *
   * @param amount
   * @param buyOrSell
   * @param marketName
   * @param stopPrice
   */
  public async placeStopMarketOrder(
    amount: CurrencyAmount,
    buyOrSell: OrderBuyOrSell,
    marketName: string,
    stopPrice: CurrencyPrice
  ): Promise<OrderPlaced> {
    const normalizedAmount = normalizeAmountForMarket(
      amount,
      this.marketData[marketName]
    );
    const normalizedStopPrice = normalizePriceForMarket(
      stopPrice,
      this.marketData[marketName]
    );

    const placeStopMarketOrderParams = createPlaceStopMarketOrderParams(
      normalizedAmount,
      buyOrSell,
      marketName,
      normalizedStopPrice
    );
    const signedPayload = await this.signPayload(placeStopMarketOrderParams);
    const result = await this.gql.mutate({
      mutation: PLACE_STOP_MARKET_ORDER_MUTATION,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    });
    const orderPlaced = result.data.placeStopMarketOrder as OrderPlaced;

    return orderPlaced;
  }

  /**
   * Sign a deposit request.
   *
   * @param address
   * @param quantity
   */
  public async signDepositRequest(
    address: string,
    quantity: CurrencyAmount
  ): Promise<SignMovement> {
    const signMovementParams = createDepositRequestParams(address, quantity);
    const signedPayload = await this.signPayload(signMovementParams);
    const result = await this.gql.mutate({
      mutation: SIGN_DEPOSIT_REQUEST_MUTATION,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    });

    const signMovement = result.data.signDepositRequest;

    return signMovement;
  }

  /**
   * Sign a withdraw request.
   *
   * @param address
   * @param quantity
   */
  public async signWithdrawRequest(
    address: string,
    quantity: CurrencyAmount
  ): Promise<SignMovement> {
    const signMovementParams = createWithdrawalRequestParams(address, quantity);
    const signedPayload = await this.signPayload(signMovementParams);
    const result = await this.gql.mutate({
      mutation: SIGN_WITHDRAW_REQUEST_MUTATION,
      variables: {
        payload: signedPayload.payload,
        signature: signedPayload.signature
      }
    });

    const signMovement = result.data.signWithdrawRequest;

    return signMovement;
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
    encryptionKey: string,
    casCookie: string
  ): Promise<void> {
    const res = encryptSecretKey(
      Buffer.from(encryptionKey, 'hex'),
      getSecretKey()
    );
    const initParams = {
      chainIndices: { neo: 1, eth: 1 },
      encryptionKey,
      enginePubkey: 'dummy',
      passphrase: '',
      secretKey: toHex(res.encryptedSecretKey),
      secretNonce: toHex(res.nonce),
      secretTag: toHex(res.tag),
      marketData: mapMarketsForGoClient(this.marketData)
    };
    this.nashCoreConfig = await this.cryptoCore.initialize(initParams);
    this.publicKey = this.nashCoreConfig.PayloadSigning.PublicKey;

    const url = this.opts.casURI + '/auth/add_initial_wallets_and_client_keys';
    const body = {
      encrypted_secret_key: initParams.secretKey,
      encrypted_secret_key_nonce: initParams.secretNonce,
      encrypted_secret_key_tag: initParams.secretTag,
      signature_public_key: this.nashCoreConfig.PayloadSigning.PublicKey,
      wallets: [
        {
          address: this.nashCoreConfig.Wallets.neo.Address,
          blockchain: 'neo',
          public_key: this.nashCoreConfig.Wallets.neo.PublicKey
        },
        {
          address: this.nashCoreConfig.Wallets.eth.Address,
          blockchain: 'eth',
          public_key: this.nashCoreConfig.Wallets.eth.PublicKey
        }
      ]
    };

    const response = await fetch(url, {
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json', cookie: casCookie },
      method: 'POST'
    });
    const result = await response.json();
    if (result.error) {
      throw new Error(result.message);
    }

    if (this.opts.debug) {
      console.log('successfully uploaded wallet keys to the CAS');
    }
  }

  /**
   * helper function that returns the correct types for the needed GQL queries
   * and mutations.
   *
   * @param payload
   */
  private async signPayload(
    payload: WrappedPayload
  ): Promise<PayloadAndSignature> {
    const signedPayload = await this.cryptoCore.signPayload(
      this.nashCoreConfig,
      payload
    );

    if (this.opts.debug) {
      const canonicalString = await this.cryptoCore.canonicalString(payload);
      console.log('canonical string: ', canonicalString);
    }

    return {
      payload: signedPayload.payload,
      signature: {
        publicKey: this.publicKey,
        signedDigest: signedPayload.signature
      }
    };
  }

  private async fetchMarketData(): Promise<{ [key: string]: Market }> {
    if (this.opts.debug) {
      console.log('fetching latest exchange market data');
    }

    const markets = await this.listMarkets();
    const marketData = {};
    let market: Market;

    for (const it of Object.keys(markets)) {
      market = markets[it];
      marketData[market.name] = market;
    }

    return marketData;
  }
}
