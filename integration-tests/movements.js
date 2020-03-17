const Nash = require('../build/main')

const client = new Nash.Client(
  Nash.EnvironmentConfiguration[process.env.NASH_ENV]
)
async function run() {
  await client.login(require('./key.json'))

  async function testDeposit(currency) {
    try {
      await client.depositToTradingContract(
        Nash.createCurrencyAmount('0.00000001', currency)
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
        quantity: Nash.createCurrencyAmount('0.1', currency),
        address: '0x7C291eB2D2Ec9A35dba0e2C395c5928cd7d90e51'
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
  await testEthTransfer(Nash.CryptoCurrency.ETH)
  await testEthTransfer(Nash.CryptoCurrency.BAT)
}

run()
