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
      '0.0216271',
      Nash.CryptoCurrency.BTC,
      Nash.CryptoCurrency.ETH
    ),
    'eth_btc'
  )
  console.log("OK: place limit order")

  await client.placeMarketOrder(
    Nash.createCurrencyAmount('1.0', Nash.CryptoCurrency.ETH),
    Nash.OrderBuyOrSell.SELL,
    'eth_btc'
  )
  console.log("OK: place market order")


  await client.placeStopMarketOrder(
    Nash.createCurrencyAmount('1.0', Nash.CryptoCurrency.ETH),
    Nash.OrderBuyOrSell.SELL,
    'eth_btc',
    Nash.createCurrencyPrice(
      '0.0216271',
      Nash.CryptoCurrency.BTC,
      Nash.CryptoCurrency.ETH
    ),
  )
  console.log("OK: place stop market order")
}

run()
