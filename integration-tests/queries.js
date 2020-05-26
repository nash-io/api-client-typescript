const Nash = require('../build/main')
const { login } = require('./utils')
const fetch = require('node-fetch')

async function run() {
  const client = new Nash.Client(
    Nash.EnvironmentConfiguration[process.env.NASH_ENV],
    {
      headers: {
        'User-Agent': 'Foo'
      }
    }
  )

  await login(client)

  async function test(name, args) {
    try {
      await client[name](...args)
      console.log(
        name + '(' + args.map(e => JSON.stringify(e)).join(', ') + ')' + ' OK'
      )
    } catch (e) {
      console.log(name + ' Failed')
      console.log(e)
    }
  }

  const con = client.createSocketConnection()

  con.onAccountTrade({ marketName: "neo_eth" }, { onStart: () => undefined })


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
  await test('getOrderBook', ['eth_neo'])
  await test('listAccountOrders', [
    {
      shouldIncludeTrades: true
    }
  ])
  await test('listAccountTrades', [])

  con.disconnect()

  const orderBook = await client.getOrderBook('eth_neo')
  if (orderBook.lastUpdateId == null) {
    throw new Error('Missing lastUpdateId')
  }
  if (orderBook.lastUpdateId == null) {
    throw new Error('Missing updateId')
  }
}

run()
