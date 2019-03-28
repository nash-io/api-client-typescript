import { client } from '../apollo'
import { LIST_MARKETS_QUERY } from '../queries/market/listMarkets'
import { GET_MARKET_QUERY } from '../queries/market/getMarket'
import { LIST_ACCOUNT_TRANSACTIONS } from '../queries/account/listAccountTransactions'
import { Market } from '../queries/market/fragments/marketFragment'
import { AccountTransaction } from '../queries/account/fragments'
import { cryptoCorePromise } from '../utils/cryptoCore'
import { CAS_HOST, SALT } from '../config'
import fetch from 'node-fetch'

export class Client {
    private cryptoCore: any
    // private initParams: any // make interface for this!
    // private chainIndices: any
    private account: any

    public async init(): Promise<void> {
        this.cryptoCore = await cryptoCorePromise
    }

    public async login(email: string, password: string): Promise<void> {
        const keys = await this.cryptoCore.deriveHKDFKeysFromPassword(password, SALT)
        const loginUrl = CAS_HOST + '/user_login'
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
        // const encryptedSecretKeyNonce = this.account.encrypted_secret_key_nonce
        // const encryptedSecretKeyTag = this.account.encrypted_secret_key_tag

        // create and upload the wallet keys if not returned from the CAS.
        if (encryptedSecretKey === null) {
            console.log('its null => creating keys')
        }

        console.log(result.account)
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

    public async listAccountTransactions(cursor: string, fiatSymbol: string, limit: number): Promise<AccountTransaction[]> {
        const vars = {
            payload: {
                cursor,
                fiatSymbol,
                limit
            },
            signature: {
                publicKey: 'dd',
                signedDigest: 'ddd'
            }
        }

        const result = await client.query({ query: LIST_ACCOUNT_TRANSACTIONS, variables: { payload: vars.payload, signature: vars.signature } })
        const accountTransactions = result.data.listAccountTransactions as AccountTransaction[]

        return accountTransactions
    }
}