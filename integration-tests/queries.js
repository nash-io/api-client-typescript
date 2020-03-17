const Nash = require('../build/main')

const client = new Nash.Client(
  Nash.EnvironmentConfiguration[process.env.NASH_ENV]
)
async function run() {
  await client.login(require('./key.json'))

  await client.getAccountBalance(Nash.CryptoCurrency.NEO)
  await client.getAccountBalance(Nash.CryptoCurrency.ETH)
  await client.getAccountBalance(Nash.CryptoCurrency.BTC)
  await client.getAccountPortfolio()
  await client.listAccountBalances(false)
  await client.listAccountBalances(true)
  await client.listAccountTransactions()
  await client.getAccountAddress(Nash.CryptoCurrency.NEO)
  await client.getAccountAddress(Nash.CryptoCurrency.ETH)
  await client.getAccountAddress(Nash.CryptoCurrency.BTC)
  await client.listAccountOrders()
  await client.listAccountOrders({
    shouldIncludeTrades: true
  })
  await client.listAccountTrades()

  const orderBook = await client.getOrderBook('eth_neo')
  if (orderBook.lastUpdateId == null) {
    throw new Error('Missing lastUpdateId')
  }
  if (orderBook.lastUpdateId == null) {
    throw new Error('Missing updateId')
  }
}

run()
