import { client } from '../apollo'
import { LIST_MARKETS_QUERY } from '../queries/market/listMarkets'
import { GET_MARKET_QUERY } from '../queries/market/getMarket'
import { LIST_ACCOUNT_TRANSACTIONS } from '../queries/account/listAccountTransactions'
import { LIST_ORDERS } from '../queries/order/listOrders'
import { LIST_ACCOUNT_BALANCES } from '../queries/account/listAccountBalances'
import { LIST_MOVEMENTS } from '../queries/movement/listMovements';
import { GET_ACCOUNT_BALANCE } from '../queries/account/getAccountBalance';
import { GET_ACCOUNT_ORDER } from '../queries/order/getAccountOrder';
import { GET_MOVEMENT } from '../queries/movement/getMovement';
import { CANCEL_ORDER_MUTATION } from '../mutations/orders/cancelOrder';
import { PLACE_LIMIT_ORDER_MUTATION } from '../mutations/orders/placeLimitOrder';
import { CurrencyAmount, CurrencyPrice } from '../queries/currency/fragments';
import { AccountDepositAddress, GET_DEPOSIT_ADDRESS } from '../queries/getDepositAddress';
import { CanceledOrder, OrderPlaced } from '../mutations/orders/fragments'
import { AccountPortfolio, GET_ACCOUNT_PORTFOLIO, Period } from '../queries/account/getAccountPortfolio'
import { AccountVolume, LIST_ACCOUNT_VOLUMES } from '../queries/account/listAccountVolumes'
import { Movement, MovementStatus, MovementType } from '../queries/movement/fragments'
import { Market, MarketStatus } from '../queries/market/fragments/marketFragment'
import { Order, OrderBuyOrSell, OrderCancellationPolicy } from '../queries/order/fragments/orderFragment'
import { AccountBalance, AccountTransaction } from '../queries/account/fragments'
import { cryptoCorePromise } from '../utils/cryptoCore'
import { CAS_HOST_LOCAL, SALT, DEBUG } from '../config'
import { FiatCurrency } from '../constants/currency'
import { getSecretKey, encryptSecretKey } from '@neon-exchange/nex-auth-protocol'
import toHex from 'array-buffer-to-hex'
import fetch from 'node-fetch'
import { DateTime, PayloadAndSignature } from '../types'
import {
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
    createListOrdersParams, Config, CryptoCurrency, WrappedPayload
} from '@neon-exchange/crypto-core-ts'

export class Client {
    private cryptoCore: any
    private initParams: any // make interface for this!
    private nashCoreConfig: Config
    private account: any
    private debug: boolean
    private publicKey: string

    constructor() {
        this.debug = DEBUG
    }

    public async init(): Promise<void> {
        this.cryptoCore = await cryptoCorePromise
    }

    /**
     * 
     * @param email 
     * @param password 
     */
    public async login(email: string, password: string): Promise<void> {
        const keys = await this.cryptoCore.deriveHKDFKeysFromPassword(password, SALT)
        const loginUrl = CAS_HOST_LOCAL + '/user_login'
        const body = {
            email,
            password: keys.authenticationKey
        }

        const response = await fetch(loginUrl, {
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST'
        })
        const casCookie = response.headers.get('set-cookie')
        const result = await response.json()
        if (result.error) {
            throw new Error(result.message);
        }
        this.account = result.account

        const encryptedSecretKey = this.account.encrypted_secret_key
        const encryptedSecretKeyNonce = this.account.encrypted_secret_key_nonce
        const encryptedSecretKeyTag = this.account.encrypted_secret_key_tag

        this.initParams = {
            chainIndices: { neo: 1, eth: 1 },
            encryptionKey: keys.encryptionKey,
            enginePubkey: "dummy",
            passphrase: '',
            secretKey: encryptedSecretKey,
            secretNonce: encryptedSecretKeyNonce,
            secretTag: encryptedSecretKeyTag,
        }

        if (encryptedSecretKey === null) {
            if (this.debug) {
                console.log("creating and uploading keys to CAS")
            }
            this.initParams.chainIndices = { neo: 1, eth: 1 }
            await this.createAndUploadKeys(keys.encryptionKey, casCookie)
            return
        }

        this.nashCoreConfig = await this.cryptoCore.initialize(this.initParams)
        this.publicKey = this.nashCoreConfig.PayloadSigning.PublicKey

        if (this.debug) {
            console.log(this.nashCoreConfig)
        }
    }

    /**
     * list available markets. 
     */
    public async listMarkets(): Promise<Market[]> {
        const result = await client.query({ query: LIST_MARKETS_QUERY })
        const markets = result.data.listMarkets as Market[]

        return markets
    }

    /**
     * get a specific market by its market name. 
     * 
     * @param marketName 
     */
    public async getMarket(marketName: string): Promise<Market> {
        const result = await client.query(
            { query: GET_MARKET_QUERY, variables: { marketName } })
        const market = result.data.getMarket as Market

        return market
    }

    /**
     * list available orders.
     * 
     * @param marketName 
     * @param status 
     */
    public async listOrders(marketName?: string, status?: MarketStatus): Promise<Order[]> {
        const listOrdersParams = createListOrdersParams(marketName, status)
        const signedPayload = await this.signPayload(listOrdersParams)

        const result = await client.query(
            {
                query: LIST_ORDERS,
                variables: { payload: signedPayload.payload, signature: signedPayload.signature }
            })
        const orders = result.data.listOrders as Order[]

        return orders
    }

    /**
     * list available account transactions.
     * 
     * @param cursor 
     * @param fiatSymbol 
     * @param limit 
     */
    public async listAccountTransactions(cursor: string, fiatSymbol: string, limit: number): Promise<AccountTransaction[]> {
        const listAccountTransactionsParams = createListAccountTransactionsParams(cursor, fiatSymbol, limit)
        const signedPayload = await this.signPayload(listAccountTransactionsParams)

        const result = await client.query(
            {
                query: LIST_ACCOUNT_TRANSACTIONS,
                variables: { payload: signedPayload.payload, signature: signedPayload.signature }
            })
        const accountTransactions = result.data.listAccountTransactions as AccountTransaction[]

        return accountTransactions
    }

    /**
     * list all balances for current authenticated account.
     * 
     * @param ignoreLowBalance 
     */
    public async listAccountBalances(ignoreLowBalance?: boolean): Promise<AccountBalance[]> {
        const listAccountBalanceParams = createListAccountBalanceParams(ignoreLowBalance)
        const signedPayload = await this.signPayload(listAccountBalanceParams)

        const result = await client.query(
            {
                query: LIST_ACCOUNT_BALANCES,
                variables: { payload: signedPayload.payload, signature: signedPayload.signature }
            })
        const accountBalances = result.data.listAccountBalances as AccountBalance[]

        return accountBalances
    }

    /**
     * get the deposit address for the given crypto currency.
     * 
     * @param currency 
     */
    public async getDepositAddress(currency: CryptoCurrency): Promise<AccountDepositAddress> {
        const getDepositAddressParams = createGetDepositAddressParams(currency)
        const signedPayload = await this.signPayload(getDepositAddressParams)

        const result = await client.query(
            {
                query: GET_DEPOSIT_ADDRESS,
                variables: { payload: signedPayload.payload, signature: signedPayload.signature }
            })
        const depositAddress = result.data.getDepositAddress as AccountDepositAddress

        return depositAddress
    }

    /**
     * get the portfolio for the current authenticated account.
     * 
     * @param fiatSymbol 
     * @param period 
     */
    public async getAccountPortfolio(fiatSymbol?: FiatCurrency, period?: Period): Promise<AccountPortfolio> {
        const getAccountPortfolioParams = createAccountPortfolioParams(fiatSymbol, period)
        const signedPayload = await this.signPayload(getAccountPortfolioParams)

        const result = await client.query(
            {
                query: GET_ACCOUNT_PORTFOLIO,
                variables: { payload: signedPayload.payload, signature: signedPayload.signature }
            })
        const accountPortfolio = result.data.getAccountPortfolio as AccountPortfolio

        return accountPortfolio
    }

    /**
     * get a movement by the given movement id.
     * 
     * @param movementID 
     */
    public async getMovement(movementID: number): Promise<Movement> {
        const getMovemementParams = createGetMovementParams(movementID)
        const signedPayload = await this.signPayload(getMovemementParams)

        const result = await client.query(
            {
                query: GET_MOVEMENT,
                variables: { payload: signedPayload.payload, signature: signedPayload.signature }
            })
        const movement = result.data.getMovement as Movement

        return movement
    }

    /**
     * get balance for the given crypto currency.
     * 
     * @param currency 
     */
    public async getAccountBalance(currency: CryptoCurrency): Promise<AccountBalance> {
        const getAccountBalanceParams = createGetAccountBalanceParams(currency)
        const signedPayload = await this.signPayload(getAccountBalanceParams)

        const result = await client.query(
            {
                query: GET_ACCOUNT_BALANCE,
                variables: { payload: signedPayload.payload, signature: signedPayload.signature }
            })
        const accountBalance = result.data.getAccountBalance as AccountBalance

        return accountBalance
    }

    /**
     * get a specific order by it's ID.
     * 
     * @param orderID 
     */
    public async getAccountOrder(orderID: string): Promise<Order> {
        const getAccountOrderParams = createGetAccountOrderParams(orderID)
        const signedPayload = await this.signPayload(getAccountOrderParams)

        const result = await client.query(
            {
                query: GET_ACCOUNT_ORDER,
                variables: { payload: signedPayload.payload, signature: signedPayload.signature }
            })
        const order = result.data.getAccountOrder as Order

        return order
    }

    /** 
     * list all volumes for the current authenticated account.
     */
    public async listAccountVolumes(): Promise<AccountVolume> {
        const listAccountVolumesParams = createListAccountVolumesParams()
        const signedPayload = await this.signPayload(listAccountVolumesParams)

        const result = await client.query(
            {
                query: LIST_ACCOUNT_VOLUMES,
                variables: { payload: signedPayload.payload, signature: signedPayload.signature }
            })
        const accountVolumes = result.data.listAccountVolumes as AccountVolume

        return accountVolumes
    }

    /**
     * list all movements for the current authenticated account.
     * 
     * @param currency 
     * @param status 
     * @param type 
     */
    public async listMovements(currency?: CryptoCurrency, status?: MovementStatus, type?: MovementType): Promise<Movement[]> {
        const listMovementParams = createListMovementsParams(currency, status, type)
        const signedPayload = await this.signPayload(listMovementParams)

        const result = await client.query(
            {
                query: LIST_MOVEMENTS,
                variables: { payload: signedPayload.payload, signature: signedPayload.signature }
            })
        const movements = result.data.listMovements as Movement[]

        return movements
    }

    /**
     * cancel an order by ID.
     * 
     * @param orderID 
     */
    public async cancelOrder(orderID: string): Promise<CanceledOrder> {
        const cancelOrderParams = createCancelOrderParams(orderID)
        const signedPayload = await this.signPayload(cancelOrderParams)

        const result = await client.query(
            {
                query: CANCEL_ORDER_MUTATION,
                variables: { payload: signedPayload.payload, signature: signedPayload.signature }
            })
        const canceledOrder = result.data.cancelOrder as CanceledOrder

        return canceledOrder
    }

    // TODO: needs go-client revision!
    // public async cancelAllOrders(orderID: string): Promise<CanceledOrder[]> {
    //     const signedPayload = await this.signPayload(cancelOrderParams)

    //     const result = await client.query(
    //         {
    //             query: CANCEL_ORDER_MUTATION,
    //             variables: { payload: signedPayload.payload, signature: signedPayload.signature }
    //         })
    //     const canceledOrder = result.data.cancelOrder as CanceledOrder

    //     return canceledOrder
    // }

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
        const placeLimitOrderParams = createPlaceLimitOrderParams(
            allowTaker,
            amount,
            buyOrSell,
            cancellationPolicy,
            limitPrice,
            marketName,
            cancelAt
        )
        const signedPayload = await this.signPayload(placeLimitOrderParams)
        const result = await client.mutate(
            {
                mutation: PLACE_LIMIT_ORDER_MUTATION,
                variables: { payload: signedPayload.payload, signature: signedPayload.signature }
            })
        const orderPlaced = result.data.placeLimitOrder as OrderPlaced

        return orderPlaced
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
    private async createAndUploadKeys(encryptionKey: string, casCookie: string): Promise<void> {
        const res = encryptSecretKey(Buffer.from(encryptionKey, 'hex'), getSecretKey())
        const initParams = {
            chainIndices: { neo: 1, eth: 1 },
            encryptionKey,
            enginePubkey: "dummy",
            passphrase: '',
            secretKey: toHex(res.encryptedSecretKey),
            secretNonce: toHex(res.nonce),
            secretTag: toHex(res.tag),
        }
        this.nashCoreConfig = await this.cryptoCore.initialize(initParams)
        this.publicKey = this.nashCoreConfig.PayloadSigning.PublicKey

        const url = CAS_HOST_LOCAL + "/auth/add_initial_wallets_and_client_keys"
        const body = {
            encrypted_secret_key: this.initParams.secretKey,
            encrypted_secret_key_nonce: this.initParams.secretNonce,
            encrypted_secret_key_tag: this.initParams.secretTag,
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
            ],
        }

        const response = await fetch(url, {
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json', cookie: casCookie },
            method: 'POST'
        })
        const result = await response.json()
        if (result.error) {
            throw new Error(result.message);
        }

        console.log('successfully uploaded wallet keys to the CAS')
    }

    /**
     * helper function that returns the correct types for the needed GQL queries
     * and mutations.
     * 
     * @param payload 
     */
    private async signPayload(payload: WrappedPayload): Promise<PayloadAndSignature> {
        const signedPayload = await this.cryptoCore.signPayload(this.nashCoreConfig, payload)
        return {
            payload: signedPayload.payload,
            signature: {
                publicKey: this.publicKey,
                signedDigest: signedPayload.signature
            }
        }
    }
}