import * as Nash from './client'
import {
  FailResult,
  Period,
  CurrencyAmount,
  OrderBuyOrSell,
  OrderCancellationPolicy,
  CurrencyPrice
} from '../types'
import { CryptoCurrency, FiatCurrency } from 'constants/currency'

const client = new Nash.Client({
  env: 'sandbox',
  debug: false
})

describe('login', () => {
  // should return an error trying to call the function without mandatory Param
  it('should return an error trying to call the function without valid Params', async done => {
    // expect to receive an object with property type = Error
    const loginData = {
      email: undefined,
      password: undefined
    }
    const market = (await client.login(loginData as undefined)) as FailResult
    expect(market.type).toBe('error')
    expect(market.message).toBe(
      'email must be of type string\npassword must be of type string'
    )
    done()
  })
})

describe('getTicker', () => {
  // should return an error trying to call the function without mandatory Param
  it('should return an error trying to call the function without mandatory Params', async done => {
    // expect to receive an object with property type = Error
    const marketName = undefined
    const market = (await client.getTicker(marketName)) as FailResult
    expect(market.type).toBe('error')
    expect(market.message).toBe('marketName must be of type string')
    done()
  })
  // should return an error when trying to call function with an invalid mandatory Param
  it('should return an error trying to call the function with invalid mandatory Param', async done => {
    // expect to receive an object with property type = error
    const marketName = (1234 as undefined) as string
    const market = (await client.getTicker(marketName)) as FailResult
    expect(market.type).toBe('error')
    expect(market.message).toBe('marketName must be of type string')
    done()
  })
})

describe('getOrderBook', () => {
  // should return an error trying to call the function without mandatory Param
  it('should return an error trying to call the function without mandatory Params', async done => {
    // expect to receive an object with property type = Error
    const marketName = undefined
    const market = (await client.getOrderBook(marketName)) as FailResult
    expect(market.type).toBe('error')
    expect(market.message).toBe('marketName must be of type string')
    done()
  })
  // should return an error when trying to call function with an invalid mandatory Param
  it('should return an error trying to call the function with invalid mandatory Param', async done => {
    // expect to receive an object with property type = error
    const marketName = 1234
    const market = (await client.getOrderBook(
      (marketName as unknown) as string
    )) as FailResult
    expect(market.type).toBe('error')
    expect(market.message).toBe('marketName must be of type string')
    done()
  })
})

describe('listTrades', () => {
  // should return an error trying to call the function without mandatory Param
  it('should return an error trying to call the function without mandatory Params', async done => {
    // expect to receive an object with property type = Error
    const marketName = undefined
    const market = (await client.listTrades({ marketName })) as FailResult
    expect(market.type).toBe('error')
    expect(market.message).toBe('marketName must be of type string')
    done()
  })
  // should return an error when trying to call function with an invalid mandatory Param
  it('should return an error trying to call the function with invalid mandatory Param', async done => {
    // expect to receive an object with property type = error
    const marketName = 1234 as undefined
    const market = (await client.listTrades({ marketName })) as FailResult
    expect(market.type).toBe('error')
    expect(market.message).toBe('marketName must be of type string')
    done()
  })
})

describe('listCandles', () => {
  // should return an error trying to call the function without mandatory Param
  it('should return an error trying to call the function without mandatory Params', async done => {
    // expect to receive an object with property type = Error
    const marketName = undefined
    const market = (await client.listCandles({ marketName })) as FailResult
    expect(market.type).toBe('error')
    expect(market.message).toBe('marketName must be of type string')
    done()
  })
  // should return an error when trying to call function with an invalid mandatory Param
  it('should return an error trying to call the function with invalid mandatory Param', async done => {
    // expect to receive an object with property type = error
    const marketName = 1234 as undefined
    const market = (await client.listCandles({ marketName })) as FailResult
    expect(market.type).toBe('error')
    expect(market.message).toBe('marketName must be of type string')
    done()
  })
})

describe('getMarket', () => {
  // should return an error trying to call the function without mandatory Param
  it('should return an error trying to call the function without mandatory Params', async done => {
    // expect to receive an object with property type = Error
    const marketName = undefined
    const market = (await client.getMarket(marketName)) as FailResult
    expect(market.type).toBe('error')
    expect(market.message).toBe('marketName must be of type string')
    done()
  })
  // should return an error when trying to call function with an invalid mandatory Param
  it('should return an error trying to call the function with invalid mandatory Param', async done => {
    // expect to receive an object with property type = error
    const marketName = 1234
    const market = (await client.getMarket(
      (marketName as unknown) as string
    )) as FailResult
    expect(market.type).toBe('error')
    expect(market.message).toBe('marketName must be of type string')
    done()
  })
})

describe('listAccountBalances', () => {
  // should return an error trying to call the function without mandatory Param
  it('should return an error trying to call the function without mandatory Params', async done => {
    // expect to receive an object with property type = Error
    const ignoreLowBalance = undefined
    const balances = (await client.listAccountBalances(
      ignoreLowBalance
    )) as FailResult
    expect(balances.type).toBe('error')
    expect(balances.message).toBe('ignoreLowBalance must be of type boolean')
    done()
  })
  // should return an error when trying to call function with an invalid mandatory Param
  it('should return an error trying to call the function with invalid mandatory Param', async done => {
    // expect to receive an object with property type = error
    const ignoreLowBalance = undefined
    const balances = (await client.listAccountBalances(
      ignoreLowBalance as boolean
    )) as FailResult
    expect(balances.type).toBe('error')
    expect(balances.message).toBe('ignoreLowBalance must be of type boolean')
    done()
  })
})

describe('getDepositAddress', () => {
  // should return an error trying to call the function without mandatory Param
  it('should return an error trying to call the function without mandatory Params', async done => {
    // expect to receive an object with property type = Error
    const currency = undefined
    const depositAddress = (await client.getDepositAddress(
      currency
    )) as FailResult
    expect(depositAddress.type).toBe('error')
    expect(depositAddress.message).toBe('currency must be of type string')
    done()
  })
  // should return an error when trying to call function with an invalid mandatory Param
  it('should return an error trying to call the function with invalid mandatory Param', async done => {
    // expect to receive an object with property type = error
    const address = 1234
    const depositAddress = (await client.getDepositAddress(
      (address as unknown) as CryptoCurrency
    )) as FailResult
    expect(depositAddress.type).toBe('error')
    expect(depositAddress.message).toBe('currency must be of type string')
    done()
  })
})

describe('getAccountPortfolio', () => {
  // should return an error trying to call the function without mandatory Param
  it('should return an error trying to call the function without mandatory Params', async done => {
    // expect to receive an object with property type = Error
    const fiatSymbol = undefined
    const period = undefined
    const depositAddress = (await client.getAccountPortfolio({
      fiatSymbol,
      period
    })) as FailResult
    expect(depositAddress.type).toBe('error')
    expect(depositAddress.message).toBe(
      'fiatSymbol must be of type string\nperiod must be of type string'
    )
    done()
  })
  // should return an error when trying to call function with an invalid mandatory Param
  it('should return an error trying to call the function with invalid mandatory Param', async done => {
    // expect to receive an object with property type = error
    const fiatSymbol = (1234 as undefined) as FiatCurrency
    const period = (1234 as undefined) as Period
    const depositAddress = (await client.getAccountPortfolio({
      fiatSymbol,
      period
    })) as FailResult
    expect(depositAddress.type).toBe('error')
    expect(depositAddress.message).toBe(
      'fiatSymbol must be of type string\nperiod must be of type string'
    )
    done()
  })
})

describe('getMovement', () => {
  // should return an error trying to call the function without mandatory Param
  it('should return an error trying to call the function without mandatory Params', async done => {
    // expect to receive an object with property type = Error
    const movementID = undefined
    const movement = (await client.getMovement(movementID)) as FailResult
    expect(movement.type).toBe('error')
    expect(movement.message).toBe('movementID must be of type number')
    done()
  })
  // should return an error when trying to call function with an invalid mandatory Param
  it('should return an error trying to call the function with invalid mandatory Param', async done => {
    // expect to receive an object with property type = error
    const movementID = ('cuca' as undefined) as number
    const movement = (await client.getMovement(movementID)) as FailResult
    expect(movement.type).toBe('error')
    expect(movement.message).toBe('movementID must be of type number')
    done()
  })
})

describe('getAccountBalance', () => {
  // should return an error trying to call the function without mandatory Param
  it('should return an error trying to call the function without mandatory Params', async done => {
    // expect to receive an object with property type = Error
    const currency = undefined as CryptoCurrency
    const accountBalance = (await client.getAccountBalance(
      currency
    )) as FailResult
    expect(accountBalance.type).toBe('error')
    expect(accountBalance.message).toBe('currency must be of type string')
    done()
  })
  // should return an error when trying to call function with an invalid mandatory Param
  it('should return an error trying to call the function with invalid mandatory Param', async done => {
    // expect to receive an object with property type = error
    const currency = (5678 as undefined) as CryptoCurrency
    const accountBalance = (await client.getAccountBalance(
      currency
    )) as FailResult
    expect(accountBalance.type).toBe('error')
    expect(accountBalance.message).toBe('currency must be of type string')
    done()
  })
})

describe('getAccountOrder', () => {
  // should return an error trying to call the function without mandatory Param
  it('should return an error trying to call the function without mandatory Params', async done => {
    // expect to receive an object with property type = Error
    const orderID = undefined as string
    const accountOrder = (await client.getAccountOrder(orderID)) as FailResult
    expect(accountOrder.type).toBe('error')
    expect(accountOrder.message).toBe('orderID must be of type string')
    done()
  })
  // should return an error when trying to call function with an invalid mandatory Param
  it('should return an error trying to call the function with invalid mandatory Param', async done => {
    // expect to receive an object with property type = error
    const orderID = (5678 as undefined) as string
    const accountOrder = (await client.getAccountOrder(orderID)) as FailResult
    expect(accountOrder.type).toBe('error')
    expect(accountOrder.message).toBe('orderID must be of type string')
    done()
  })
})

describe('getOrdersForMovement', () => {
  // should return an error trying to call the function without mandatory Param
  it('should return an error trying to call the function without mandatory Params', async done => {
    // expect to receive an object with property type = Error
    const asset = undefined as string
    const ordersFormove = (await client.getAccountOrder(asset)) as FailResult
    expect(ordersFormove.type).toBe('error')
    expect(ordersFormove.message).toBe('orderID must be of type string')
    done()
  })
  // should return an error when trying to call function with an invalid mandatory Param
  it('should return an error trying to call the function with invalid mandatory Param', async done => {
    // expect to receive an object with property type = error
    const asset = (1234 as undefined) as string
    const ordersFormove = (await client.getAccountOrder(asset)) as FailResult
    expect(ordersFormove.type).toBe('error')
    expect(ordersFormove.message).toBe('orderID must be of type string')
    done()
  })
})

describe('placeLimitOrder', () => {
  // should return an error trying to call the function without mandatory Param
  it('should return an error trying to call the function without mandatory Params', async done => {
    // expect to receive an object with property type = Error
    const allowTaker = undefined as boolean
    const amount = undefined as CurrencyAmount
    const buyOrSell = undefined as OrderBuyOrSell
    const cancellationPolicy = undefined as OrderCancellationPolicy
    const limitPrice = undefined as CurrencyPrice
    const marketName = undefined as string
    const ordersFormove = (await client.placeLimitOrder(
      allowTaker,
      amount,
      buyOrSell,
      cancellationPolicy,
      limitPrice,
      marketName
    )) as FailResult
    expect(ordersFormove.type).toBe('error')
    expect(ordersFormove.message).toBe(
      `allowTaker must be of type boolean\namount must be of type object\nlimitPrice must be of type object\ncancellationPolicy must be of type string\nbuyOrSell must be of type string\nmarketName must be of type string`
    )
    done()
  })
  // should return an error when trying to call function with an invalid mandatory Param
  it('should return an error trying to call the function with invalid mandatory Param', async done => {
    // expect to receive an object with property type = error
    const allowTaker = ('alalal' as undefined) as boolean
    const amount = ('alalla' as undefined) as CurrencyAmount
    const buyOrSell = (1234 as undefined) as OrderBuyOrSell
    const cancellationPolicy = (12343 as undefined) as OrderCancellationPolicy
    const limitPrice = (1234 as undefined) as CurrencyPrice
    const marketName = (1234 as undefined) as string
    const ordersFormove = (await client.placeLimitOrder(
      allowTaker,
      amount,
      buyOrSell,
      cancellationPolicy,
      limitPrice,
      marketName
    )) as FailResult
    expect(ordersFormove.type).toBe('error')
    expect(ordersFormove.message).toBe(
      `allowTaker must be of type boolean\namount must be of type object\nlimitPrice must be of type object\ncancellationPolicy must be of type string\nbuyOrSell must be of type string\nmarketName must be of type string`
    )
    done()
  })
})

describe('placeMarketOrder', () => {
  // should return an error trying to call the function without mandatory Param
  it('should return an error trying to call the function without mandatory Params', async done => {
    // expect to receive an object with property type = Error
    const amount = undefined as CurrencyAmount
    const buyOrSell = undefined as OrderBuyOrSell
    const marketName = undefined as string
    const ordersFormove = (await client.placeMarketOrder(
      amount,
      buyOrSell,
      marketName
    )) as FailResult
    expect(ordersFormove.type).toBe('error')
    expect(ordersFormove.message).toBe(
      'buyOrSell must be of type string\nmarketName must be of type string'
    )
    done()
  })
  // should return an error when trying to call function with an invalid mandatory Param
  it('should return an error trying to call the function with invalid mandatory Param', async done => {
    // expect to receive an object with property type = error
    const amount = (1234 as undefined) as CurrencyAmount
    const buyOrSell = (1234 as undefined) as OrderBuyOrSell
    const marketName = (1234 as undefined) as string
    const ordersFormove = (await client.placeMarketOrder(
      amount,
      buyOrSell,
      marketName
    )) as FailResult
    expect(ordersFormove.type).toBe('error')
    expect(ordersFormove.message).toBe(
      'buyOrSell must be of type string\nmarketName must be of type string'
    )
    done()
  })
})

describe('placeStopLimitOrder', () => {
  // should return an error trying to call the function without mandatory Param
  it('should return an error trying to call the function without mandatory Params', async done => {
    // expect to receive an object with property type = Error
    const allowTaker = undefined as boolean
    const amount = undefined as CurrencyAmount
    const buyOrSell = undefined as OrderBuyOrSell
    const cancellationPolicy = undefined as OrderCancellationPolicy
    const limitPrice = undefined as CurrencyPrice
    const marketName = undefined as string
    const stopPrice = undefined as CurrencyPrice
    const ordersFormove = (await client.placeStopLimitOrder(
      allowTaker,
      amount,
      buyOrSell,
      cancellationPolicy,
      limitPrice,
      marketName,
      stopPrice
    )) as FailResult
    expect(ordersFormove.type).toBe('error')
    expect(ordersFormove.message).toBe(
      'allowTaker must be of type boolean\nbuyOrSell must be of type string\nmarketName must be of type string\ncancellationPolicy must be of type string\ncancelAt must be of type undefined'
    )
    done()
  })
  // should return an error when trying to call function with an invalid mandatory Param
  it('should return an error trying to call the function with invalid mandatory Param', async done => {
    // expect to receive an object with property type = error
    const allowTaker = ('alalal' as undefined) as boolean
    const amount = ('alalla' as undefined) as CurrencyAmount
    const buyOrSell = (1234 as undefined) as OrderBuyOrSell
    const cancellationPolicy = (12343 as undefined) as OrderCancellationPolicy
    const limitPrice = (1234 as undefined) as CurrencyPrice
    const marketName = (1234 as undefined) as string
    const stopPrice = (1234 as undefined) as CurrencyPrice
    const ordersFormove = (await client.placeStopLimitOrder(
      allowTaker,
      amount,
      buyOrSell,
      cancellationPolicy,
      limitPrice,
      marketName,
      stopPrice
    )) as FailResult
    expect(ordersFormove.type).toBe('error')
    expect(ordersFormove.message).toBe(
      'allowTaker must be of type boolean\nbuyOrSell must be of type string\nmarketName must be of type string\ncancellationPolicy must be of type string\ncancelAt must be of type undefined'
    )
    done()
  })
})

describe('placeStopMarketOrder', () => {
  // should return an error trying to call the function without mandatory Param
  it('should return an error trying to call the function without mandatory Params', async done => {
    // expect to receive an object with property type = Error
    const amount = undefined as CurrencyAmount
    const buyOrSell = undefined as OrderBuyOrSell
    const marketName = undefined as string
    const stopPrice = undefined as CurrencyPrice
    const ordersFormove = (await client.placeStopMarketOrder(
      amount,
      buyOrSell,
      marketName,
      stopPrice
    )) as FailResult
    expect(ordersFormove.type).toBe('error')
    expect(ordersFormove.message).toBe(
      'amount must be of type object\nstopPrice must be of type object\nbuyOrSell must be of type string\nmarketName must be of type string'
    )
    done()
  })
  // should return an error when trying to call function with an invalid mandatory Param
  it('should return an error trying to call the function with invalid mandatory Param', async done => {
    // expect to receive an object with property type = error
    const amount = (1234 as undefined) as CurrencyAmount
    const buyOrSell = (1234 as undefined) as OrderBuyOrSell
    const marketName = (1234 as undefined) as string
    const stopPrice = (1234 as undefined) as CurrencyPrice
    const ordersFormove = (await client.placeStopMarketOrder(
      amount,
      buyOrSell,
      marketName,
      stopPrice
    )) as FailResult
    expect(ordersFormove.type).toBe('error')
    expect(ordersFormove.message).toBe(
      'amount must be of type object\nstopPrice must be of type object\nbuyOrSell must be of type string\nmarketName must be of type string'
    )
    done()
  })
})
