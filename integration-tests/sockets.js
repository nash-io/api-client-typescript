const Nash = require('../build/main')
const client = new Nash.Client(
  Nash.EnvironmentConfiguration[process.env.NASH_ENV]
)
const wait = n => new Promise(r => setTimeout(r, n))
async function testDisconnect() {
  await client.login({
    email: process.env.NASH_EMAIL,
    password: process.env.NASH_PASSWORD
  })

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
  await client.login({
    email: process.env.NASH_EMAIL,
    password: process.env.NASH_PASSWORD
  })

  const connection = client.createSocketConnection()
  function runTest(test, args) {
    const tstName = test + '(' + JSON.stringify(args) + ')'
    // console.log('Running ' + tstName)
    return new Promise((resolve, reject) => {
      let resolved = false
      connection[test](args, {
        onError() {
          if (resolved) {
            return
          }
          console.log('Failed ' + tstName)
          resolved = true
          reject()
        },
        onAbort() {
          if (resolved) {
            return
          }
          console.log('Failed ' + tstName)
          resolved = true
          reject()
        },
        onStart() {
          console.log('OK ' + tstName)
          resolved = true
          resolve()
        }
      })
    })
  }
  for (const interval of Object.values(Nash.CandleInterval)) {
    await runTest('onUpdatedCandles', {
      marketName: 'eth_neo',
      interval
    })
  }
  await runTest('onNewTrades', {
    marketName: 'eth_neo'
  })
  await runTest('onUpdatedOrderbook', {
    marketName: 'eth_neo'
  })
  await runTest('onUpdatedAccountOrders', {})
  await runTest('onAccountTrade', {
    marketName: 'eth_neo'
  })

  connection.socket.disconnect()
}

async function test() {
  await testDisconnect()
  await testSubscriptions()
}

test()
