const Nash = require('../build/main')

const client = new Nash.Client(
  Nash.EnvironmentConfiguration[process.env.NASH_ENV]
)
async function run() {
  await client.login(require('./key.json'))

  async function test(name, args) {
    try {
      await client[name](...args)
      console.log(
        name + '(' + args.map(e => JSON.stringify(e)).join(', ') + ')' + ' OK'
      )
    } catch (e) {
      console.log(name + ' Failed')
    }
  }

  await test('getAccountBalance', [Nash.CryptoCurrency.NEO])
  await test('getAccountBalance', [Nash.CryptoCurrency.ETH])
  await test('getAccountBalance', [Nash.CryptoCurrency.BTC])
  await test('getAccountPortfolio', [])
  await test('listAccountBalances', [false])
  await test('listAccountBalances', [true])
  await test('listAccountTransactions', [])
  await test('getAccountAddress', [Nash.CryptoCurrency.NEO])
  await test('getAccountAddress', [Nash.CryptoCurrency.ETH])
  await test('getAccountAddress', [Nash.CryptoCurrency.BTC])
  await test('listAccountOrders', [])
  await test('listAccountOrders', [
    {
      shouldIncludeTrades: true
    }
  ])
  await test('listAccountTrades', [])

  const orderBook = await client.getOrderBook('eth_neo')
  if (orderBook.lastUpdateId == null) {
    throw new Error('Missing lastUpdateId')
  }
  if (orderBook.lastUpdateId == null) {
    throw new Error('Missing updateId')
  }
}

run()
