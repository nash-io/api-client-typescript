import { client } from '../apollo'
import { LIST_MARKETS_QUERY } from '../queries/market/listMarkets'
import { GET_MARKET_QUERY } from '../queries/market/getMarket'
import { LIST_ACCOUNT_TRANSACTIONS } from '../queries/account/listAccountTransactions'
import { Market } from '../queries/market/fragments/marketFragment'
import { AccountTransaction } from '../queries/account/fragments'
// import { CAS_HOST } from '../config'

export class Client {
    // public async login(username: string, password: string): Promise<void> {

    // }

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