const Nash = require('../build/main')
const { login } = require('./utils')

async function run() {
  const client = new Nash.Client(
    Nash.EnvironmentConfiguration[process.env.NASH_ENV]
  )
  await login(client)
  await client.placeLimitOrder(
    false,
    Nash.createCurrencyAmount('1.0', Nash.CryptoCurrency.ETH),
    Nash.OrderBuyOrSell.BUY,
    Nash.OrderCancellationPolicy.GOOD_TIL_CANCELLED,
    Nash.createCurrencyPrice(
      '0.0212632',
      Nash.CryptoCurrency.BTC,
      Nash.CryptoCurrency.ETH
    ),
    'eth_btc'
  )
}

run()
