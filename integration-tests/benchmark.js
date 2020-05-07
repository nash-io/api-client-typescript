const Nash = require('../build/main')
const { login } = require('./utils')

const client = new Nash.Client(
  Nash.EnvironmentConfiguration[process.env.NASH_ENV],
  {
    runRequestsOverWebsockets: true,
    enablePerformanceTelemetry: true,
    performanceTelemetryTag: "benchmark"
  }
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
  console.time('test')
  // const orders = [
  //   client.placeLimitOrder(
  //     false,
  //     Nash.createCurrencyAmount('1.0', Nash.CryptoCurrency.ETH),
  //     Nash.OrderBuyOrSell.SELL,
  //     Nash.OrderCancellationPolicy.GOOD_TIL_CANCELLED,
  //     Nash.createCurrencyPrice(
  //       '0.0210000',
  //       Nash.CryptoCurrency.USDC,
  //       Nash.CryptoCurrency.ETH
  //     ),
  //     'eth_usdc'
  //   ),
  //   client.placeLimitOrder(
  //     false,
  //     Nash.createCurrencyAmount('1.1', Nash.CryptoCurrency.ETH),
  //     Nash.OrderBuyOrSell.SELL,
  //     Nash.OrderCancellationPolicy.GOOD_TIL_CANCELLED,
  //     Nash.createCurrencyPrice(
  //       '0.0200000',
  //       Nash.CryptoCurrency.USDC,
  //       Nash.CryptoCurrency.ETH
  //     ),
  //     'eth_usdc'
  //   ),
  // ]
  // await Promise.all(orders)
  // await client.cancelAllOrders()
  await benchmark('listMarkets', 10, () => client.listMarkets())
  // await benchmark('placeLimitOrder_eth_neo', 50, async i => {
  //   await client.placeLimitOrder(
  //     false,
  //     Nash.createCurrencyAmount('1.0', Nash.CryptoCurrency.ETH),
  //     Nash.OrderBuyOrSell.SELL,
  //     Nash.OrderCancellationPolicy.GOOD_TIL_CANCELLED,
  //     Nash.createCurrencyPrice(
  //       '0.0200000',
  //       Nash.CryptoCurrency.NEO,
  //       Nash.CryptoCurrency.ETH
  //     ),
  //     'eth_neo'
  //   )
  //   await client.cancelAllOrders()
  // })
  await benchmark('placeLimitOrder_eth_btc', 20, async i => {
    await client.placeLimitOrder(
      false,
      Nash.createCurrencyAmount('1.0', Nash.CryptoCurrency.ETH),
      Nash.OrderBuyOrSell.SELL,
      Nash.OrderCancellationPolicy.GOOD_TIL_CANCELLED,
      Nash.createCurrencyPrice(
        '0.0200000',
        Nash.CryptoCurrency.BTC,
        Nash.CryptoCurrency.ETH
      ),
      'eth_btc'
    )
  })
  await client.cancelAllOrders('eth_btc')
  await benchmark('cancelAllOrders', 10, () => client.cancelAllOrders())
  await benchmark('placeLimitOrde_eth_usdc', 20, i => client.placeLimitOrder(
    false,
    Nash.createCurrencyAmount('0.0200000', Nash.CryptoCurrency.ETH),
    Nash.OrderBuyOrSell.SELL,
    Nash.OrderCancellationPolicy.GOOD_TIL_CANCELLED,
    Nash.createCurrencyPrice(
      '200.0',
      Nash.CryptoCurrency.USDC,
      Nash.CryptoCurrency.ETH
    ),
    'eth_usdc'
  ))
  // await client.cancelAllOrders('eth_usdc')
  console.timeEnd('test')
  client.disconnect()
  client.perfClient.flush()
}

run()
