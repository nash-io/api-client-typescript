const Nash = require('../build/main')

const client = new Nash.Client(Nash.EnvironmentConfiguration[process.env.ENV])
async function run() {
  await client.login({
    email: process.env.EMAIL,
    password: process.env.PASSWORD
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
