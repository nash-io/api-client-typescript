import { client } from '../apollo'
import { LIST_MARKETS_QUERY } from '../queries/market/listMarkets'
import { GET_MARKET_QUERY } from '../queries/market/getMarket'
import { LIST_ACCOUNT_TRANSACTIONS } from '../queries/account/listAccountTransactions'
import { LIST_ORDERS } from '../queries/order/listOrders'
import { Market, MarketStatus } from '../queries/market/fragments/marketFragment'
import { Order } from '../queries/order/fragments/order'
import { AccountTransaction } from '../queries/account/fragments'
import { cryptoCorePromise } from '../utils/cryptoCore'
import { CAS_HOST_LOCAL, SALT, DEBUG } from '../config'
import fetch from 'node-fetch'
import { getSecretKey, encryptSecretKey } from '@neon-exchange/nex-auth-protocol'
import toHex from 'array-buffer-to-hex'
import { createListAccountTransactionsParams, createListOrdersParams, Config } from '@neon-exchange/crypto-core-ts'

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

        const result = await response.json()
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

        // TODO: create and upload the wallet keys if not returned from the CAS.
        if (encryptedSecretKey === null) {
            if (this.debug) {
                console.log("creating and uploading keys to CAS")
            }
            this.initParams.chainIndices = { neo: 1, eth: 1 }
            this.createAndUploadKeys(keys.encryptionKey)
        }


        this.nashCoreConfig = await this.cryptoCore.initialize(this.initParams)
        this.publicKey = this.nashCoreConfig.PayloadSigning.PublicKey

        if (this.debug) {
            console.log(this.nashCoreConfig)
        }
    }

    public async listMarkets(): Promise<Market[]> {
        const result = await client.query({ query: LIST_MARKETS_QUERY })
        const markets = result.data.listMarkets as Market[]

        return markets
    }

    public async getMarket(marketName: string): Promise<Market> {
        const result = await client.query(
            { query: GET_MARKET_QUERY, variables: { marketName } })
        const market = result.data.getMarket as Market

        return market
    }

    public async listOrders(marketName?: string, status?: MarketStatus): Promise<Order[]> {
        const listOrdersParams = createListOrdersParams(marketName, status)
        const signedPayload = await this.cryptoCore.signPayload(this.nashCoreConfig, listOrdersParams)
        const signature = {
            publicKey: this.publicKey,
            signedDigest: signedPayload.signature
        }
        const result = await client.query({ query: LIST_ORDERS, variables: { payload: signedPayload.payload, signature } })
        const orders = result.data.listOrders as Order[]

        return orders
    }

    public async listAccountTransactions(cursor: string, fiatSymbol: string, limit: number): Promise<AccountTransaction[]> {
        const listAccountTransactionsParams = createListAccountTransactionsParams(cursor, fiatSymbol, limit)
        const signedPayload = await this.cryptoCore.signPayload(this.nashCoreConfig, listAccountTransactionsParams)
        const signature = {
            publicKey: this.publicKey,
            signedDigest: signedPayload.signature
        }

        const result = await client.query({ query: LIST_ACCOUNT_TRANSACTIONS, variables: { payload: signedPayload.payload, signature } })
        const accountTransactions = result.data.listAccountTransactions as AccountTransaction[]

        return accountTransactions
    }

    private async createAndUploadKeys(encryptionKey: string): Promise<void> {
        const res = encryptSecretKey(Buffer.from(encryptionKey, 'hex'), getSecretKey())
        this.initParams.secretKey = toHex(res.encryptedSecretKey)
        this.initParams.secretNonce = toHex(res.nonce)
        this.initParams.secretTag = toHex(res.tag)
    }
}

// listMarkets
// getMarket
// listOrders
// listAccountTransactions