const Nash = require('@neon-exchange/api-client-typescript');

const client = new Nash.Client(Nash.EnvironmentConfiguration.production)

const apiKeys = {
  "secret": "your secret",
  "apiKey": "your key"
}

const runAuthenticated = async () => {
  try {
    await client.login(apiKeys)
  } catch (e) {
    console.log(e);
  }
}

const run = async () => {
  await runAuthenticated();
  await doTradeEthUsdc()
}

const doTradeEthUsdc = async() => {

  let price = 400
  try {
    const amount = {amount:"0.05", currency:"eth"}
    const result = await client.placeLimitOrder(
      false, 
      amount, 
      Nash.OrderBuyOrSell.SELL, 
      Nash.OrderCancellationPolicy.GOOD_TIL_CANCELLED,
      {amount:price.toString(), currencyA: Nash.CryptoCurrency.USDC, currencyB: Nash.CryptoCurrency.ETH},
      "eth_usdc")
    console.log("RESULT: ", result, price.toString())  
  } catch(e) {
    console.log("error: ", e)
  }
}


run();
