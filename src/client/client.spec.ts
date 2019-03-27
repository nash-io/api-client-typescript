import { client } from '../apollo'
// import { LIST_MARKETS_QUERY } from '../queries/market/listMarkets'
import { GET_MARKET_QUERY } from '../queries/market/getMarket'

test('returns an AEAD object', async () => {
    client.query({ query: GET_MARKET_QUERY, variables: { marketName: "eth_neo" } }).then(console.log)
    console.log('yow this is it')
})