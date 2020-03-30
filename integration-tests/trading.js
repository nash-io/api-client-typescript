const Nash = require('../build/main')

const client = new Nash.Client(
  Nash.EnvironmentConfiguration[process.env.NASH_ENV]
)
async function run() {
  await client.login(require('./key.json'))
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
