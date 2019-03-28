import { Client } from '../client'
import { cryptoCorePromise } from '../utils/cryptoCore'



test('client do something', async () => {
    const cryptoCore = await cryptoCorePromise
    console.log(cryptoCore)

    const c = new Client
    const markets = await c.listMarkets()
    console.log(markets)

    const market = await c.getMarket("eth_neo")
    console.log(market)
})
