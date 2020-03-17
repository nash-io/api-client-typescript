const Nash = require('../build/main')

const client = new Nash.Client(
  Nash.EnvironmentConfiguration[process.env.NASH_ENV]
)
async function run() {
  await client.login({
    email: process.env.NASH_EMAIL,
    password: process.env.NASH_PASSWORD
  })

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
}

run()
