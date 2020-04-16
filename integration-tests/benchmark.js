const Nash = require('../build/main')
const { login } = require('./utils')

const client = new Nash.Client(
  {
    ...Nash.EnvironmentConfiguration[process.env.NASH_ENV],
    runRequestsOverWebsockets: true
  },
)


const benchmark = async (name, n, fn) => {
  const t0 = Date.now()
  for(let i = 0 ; i < n ; i ++) {
    await fn(i)
  }

  const d = Date.now() - t0

  console.log(`${n} ${name} ran in ${d}ms. Or ${d/n}ms pr attempt`)
}

async function run() {
  await login(client)
  // await benchmark('listMarkets', 10, () => client.listMarkets())
  // await benchmark('placeLimitOrder_ethbtc', 10, i => client.placeLimitOrder(
  //   false,
  //   Nash.createCurrencyAmount('1.0', Nash.CryptoCurrency.ETH),
  //   Nash.OrderBuyOrSell.SELL,
  //   Nash.OrderCancellationPolicy.GOOD_TIL_CANCELLED,
  //   Nash.createCurrencyPrice(
  //     '0.0200000',
  //     Nash.CryptoCurrency.BTC,
  //     Nash.CryptoCurrency.ETH
  //   ),
  //   'eth_btc'
  // ))
  // await client.cancelAllOrders('eth_btc')
  await benchmark('cancelAllOrders', 20, () => client.cancelAllOrders())
  // await benchmark('placeLimitOrde_ethusdc', 20, i => client.placeLimitOrder(
  //   false,
  //   Nash.createCurrencyAmount('0.0200000', Nash.CryptoCurrency.ETH),
  //   Nash.OrderBuyOrSell.SELL,
  //   Nash.OrderCancellationPolicy.GOOD_TIL_CANCELLED,
  //   Nash.createCurrencyPrice(
  //     '200.0',
  //     Nash.CryptoCurrency.USDC,
  //     Nash.CryptoCurrency.ETH
  //   ),
  //   'eth_usdc'
  // ))
  // console.log(await client.placeLimitOrder(
  //   false,
  //   Nash.createCurrencyAmount('0.0200000', Nash.CryptoCurrency.ETH),
  //   Nash.OrderBuyOrSell.SELL,
  //   Nash.OrderCancellationPolicy.GOOD_TIL_CANCELLED,
  //   Nash.createCurrencyPrice(
  //     '200.0',
  //     Nash.CryptoCurrency.USDC,
  //     Nash.CryptoCurrency.ETH
  //   ),
  //   'eth_usdc'
  // ))
  // await client.cancelAllOrders('eth_usdc')
  client.disconnect()
}

run()
