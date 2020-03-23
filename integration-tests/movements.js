const Nash = require('../build/main')
const { wait } = require('./utils')

const client = new Nash.Client(
  Nash.EnvironmentConfiguration[process.env.NASH_ENV]
)
async function run() {
  await client.login(require('./key.json'))
  async function testDeposit(currency) {
    try {
      await client.depositToTradingContract(
        Nash.createCurrencyAmount('0.0001', currency)
      )
      console.log('ok ' + currency + ' personal -> trading')
    } catch (e) {
      console.log('failed ' + currency + ' personal -> trading')
      console.log(e.message)
    }
  }

  async function testEthTransfer(currency) {
    try {
      await client.transferToExternal({
        quantity: Nash.createCurrencyAmount('0.01', currency),
        address: client.getEthAddress()
      })
      console.log('ok ' + currency + ' personal -> external')
    } catch (e) {
      console.log('failed ' + currency + ' personal -> external')
      console.log(e.message)
    }
  }
  async function testNeoTransfer(currency) {
    try {
      await client.transferToExternal({
        quantity: Nash.createCurrencyAmount('0.01', currency),
        address: client.getNeoAddress()
      })
      console.log('ok ' + currency + ' personal -> external')
    } catch (e) {
      console.log('failed ' + currency + ' personal -> external')
      console.log(e.message)
    }
  }

  await testDeposit(Nash.CryptoCurrency.GAS)
  await testDeposit(Nash.CryptoCurrency.NOS)
  await testDeposit(Nash.CryptoCurrency.ETH)
  await testDeposit(Nash.CryptoCurrency.BAT)
  await testDeposit(Nash.CryptoCurrency.BTC)
  await testEthTransfer(Nash.CryptoCurrency.ETH)
  await testEthTransfer(Nash.CryptoCurrency.BAT)
  await testNeoTransfer(Nash.CryptoCurrency.GAS)
  await testNeoTransfer(Nash.CryptoCurrency.NOS)

  // await client.transferToExternal({
  //   quantity: Nash.createCurrencyAmount('1', Nash.CryptoCurrency.BTC),
  //   address: '2NDs4XmexZSaZqqFMHhNQ2DatEpCLmVjQto'
  // })
}

run()
