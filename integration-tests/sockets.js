const Nash = require('../build/main')
const { wait, login } = require('./utils')

async function testDisconnect() {
  const client = new Nash.Client(
    Nash.EnvironmentConfiguration[process.env.NASH_ENV]
  )
  await login(client)

  const connection = client.createSocketConnection()
  let state = null
  connection.socket.onOpen(() => (state = true))
  connection.socket.onClose(() => (state = false))

  connection.onUpdatedTickers({
    onError() {},
    onAbort() {},
    onStart() {},
    onResult() {}
  })
  await wait(100)
  connection.socket.disconnect()
  await wait(100)
  if (state !== false) {
    throw Error('Fail: Disconnect logic does not work')
  }
  console.log('OK: socket can disconnect correctly')
}
async function testSubscriptions() {
  const client = new Nash.Client(
    Nash.EnvironmentConfiguration[process.env.NASH_ENV]
  )
  function runTest(connection, test, args) {
    const tstName = test + '(' + JSON.stringify(args) + ')'
    // console.log('Running ' + tstName)
    return new Promise((resolve, reject) => {
      let resolved = false
      connection[test](args, {
        onError(e) {
          if (resolved) {
            return
          }
          console.log('Failed ' + tstName)
          resolved = true
          reject(e)
        },
        onAbort(e) {
          if (resolved) {
            return
          }
          console.log('Failed ' + tstName)
          resolved = true
          reject(e)
        },
        onStart() {
          console.log('OK ' + tstName)
          resolved = true
          resolve()
        }
      })
    })
  }
  let connection = client.createSocketConnection()
  await runTest(connection, 'onNewTrades', {
    marketName: 'bat_neo'
  })
  await runTest(connection, 'onUpdatedOrderbook', {
    marketName: 'bat_neo'
  })
  connection.socket.disconnect()

  await login(client)
  connection = client.createSocketConnection()
  for (const interval of Object.values(Nash.CandleInterval)) {
    await runTest(connection, 'onUpdatedCandles', {
      marketName: 'eth_neo',
      interval
    })
  }
  await runTest(connection, 'onNewTrades', {
    marketName: 'eth_neo'
  })
  await runTest(connection, 'onUpdatedOrderbook', {
    marketName: 'eth_neo'
  })
  await runTest(connection, 'onUpdatedAccountOrders', {})
  await runTest(connection, 'onAccountTrade', {
    marketName: 'eth_neo'
  })

  connection.socket.disconnect()
}

async function test() {
  await testDisconnect()
  await testSubscriptions()
}

test()
