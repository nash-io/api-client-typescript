const Nash = require('../build/main')
const { wait } = require('./utils')

async function run() {
  let movement, signature, blockchainSignature
  try {
    const faultyClient = new Nash.Client({
      ...Nash.EnvironmentConfiguration[process.env.NASH_ENV],
      maxEthCostPrTransaction: '1.0'
    })
    await faultyClient.login(require('./key.json'))
    faultyClient.updateDepositWithdrawalMovementWithTx = () => {
      throw new Error("We fail to submit the tx to our backend")
    }
    const p = faultyClient.depositToTradingContract(
      Nash.createCurrencyAmount("0.001", Nash.CryptoCurrency.GAS)
    )
    p.once("movement", p => movement = p)
    p.once("signature", p => signature = p)
    p.once("blockchainSignature", p => blockchainSignature = p) // may or may not be computed
    await p
  } catch (e) {
    // console.log("Time to handle the unexpected error")
  }

  try {
    const client = new Nash.Client({
      ...Nash.EnvironmentConfiguration[process.env.NASH_ENV],
      maxEthCostPrTransaction: '1.0'
    })
    await client.login(require('./key.json'))
    await client.resumeTradingContractTransaction({
      movement,
      signature,
      blockchainSignature
    })
    console.log('ok client resumed tx')
  } catch(e){
    console.log(e)
    console.log('fail client could not resume tx')
  }
}

run()
