import { Client } from '../client'


test('client do something', async () => {
    const c = new Client
    const markets = await c.listMarkets()
    console.log(markets)

    const market = await c.getMarket("eth_neo")
    console.log(market)
})
