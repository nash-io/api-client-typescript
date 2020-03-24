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

  async function testTransfer(currency, address) {
    try {
      await client.transferToExternal({
        quantity: Nash.createCurrencyAmount('0.01', currency),
        address
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
  await testTransfer(Nash.CryptoCurrency.ETH, client.getEthAddress())
  await testTransfer(Nash.CryptoCurrency.BAT, client.getEthAddress())
  await testTransfer(Nash.CryptoCurrency.GAS, client.getNeoAddress())
  await testTransfer(Nash.CryptoCurrency.NOS, client.getNeoAddress())
  await testTransfer(Nash.CryptoCurrency.BTC, client.getBtcAddress())
}

run()
