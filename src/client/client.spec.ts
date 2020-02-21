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
  apiURI: 'https://app.sandbox.nash.io/api/graphql',
  debug: false
})

describe('login', () => {
  // should return an error trying to call the function without mandatory Param
  it('should return an error trying to call the function without valid Params', async done => {
    // expect to receive an object with property type = Error
    const loginData = {
      secret:
        'eyJjaGlsZF9rZXlzIjp7Im0vNDQnLzAnLzAnLzAvMCI6eyJhZGRyZXNzIjoiMk11ZXk5M0Fpa2ljVGp6NmdmcExmM2tETWZTdlpKUHg0Nk0iLCJjbGllbnRfc2VjcmV0X3NoYXJlIjoiYjVmZWQzODdjODJjZjdlYzEzNGY2ZTdjMTVjMzUzODA3ZGM2NDQ2MTJjNWM2OTdiNDZmNmFmZmIyNzE5MjRiYyIsInB1YmxpY19rZXkiOiIwMzEyNTlkNWEyZGE1ZTJiNWFjMThiZjY1ODU0MDI0MTJmNmQ4N2RlMGY2ZWI0MWM5ZWNkNjllMzZiOTA4OGM1ZjgiLCJzZXJ2ZXJfc2VjcmV0X3NoYXJlX2VuY3J5cHRlZCI6IjEzYTMyYTEyYThlNGQ4ZjNlZjQ1ODg2NGQ5Mjk4MGIyNTEwM2M4M2ZkNGEyODNlYmU0OTliOTYwZDY5NGQ0Njk5YWFlY2IxNzEyZmY1OWFjZTIxYjZkYWU5M2YzOGEzZTgxOWUxNDQ4NzE3MDUxMThiN2E5NTFmNGMzMDI0MmI3YzU2MjdhMmY4Y2Q4ZmE2NDM4MGY0OGFmNzgyYTI0MDRiMzViNWNjZDcwNmJmNmNjYjFkN2QwNmIwMGQ2YmRhMWMzMDhmNTFiM2Y3YWZlYTQ1YTBiZTI4NTQ0NWY4MjkzODZlMTllOWQ1NTZiNWI4NGRkYmYxYzIzMzI0MWZlY2QzZTNjYTBiZWM5YWNjNGMzODBmNDUzZjkyODE5NjhkNzhjMWI0M2RiMWU2YmRhOTU5NzNhYTI1OTFlYTNiZDg3NmVmMmUxOTJjNmI5NTVmMTgzNmFiYjBmOGZjNDg2MTg3OTgwMmVmMGJmNTY3YzU2MjQ0YWViY2UxMDMzMGQzODE1NGNkZDRhNjZlN2M0YzNiMjE1MmIwOWZiMmFjYzk3ZWM2NTMwN2E0OWQzNDIwZTdjOTA3NDQ3YmRlYzlhOWVjNmNkYzEzYTI1ZTU5ZWYzMTc4YWMwZWE5MDZjOWVjMzQxZWEwZTlkNGM2MDk4ODdjYjIwN2NkOWFhYTczMzA2OTM1MGM3MWFmMTIwNmQ3YThmMzllMDQ5MDJjNzY3ODRhMmMwMTViZmQ1MTAyODRlZDYwOTIwOTE2MDJlYjRkNmRmMjMwMzhiZWZhM2E0OTk0NGEwNjc3ZjIwOTM1NzNmZGIyZmNjNDYxM2NhMWZkZWI1ZjI0OTdiZTRhZTQ4MGVhYTMxYTRhM2E2ZGI5Y2E1ZGY4OTI5Y2NmODY3MDMxMmE3M2E0MDcyNWM2YTA4MmE1ZmJhZGE0NGYyODEwOTljMzRhYTNkNzIxN2QzNDc5NTIyNWQzNzQ1Nzc1OTY4ZGJkMDNhMWNhYWY4ZWQzNjQ3M2RkOTgwOWIxYmQzOTM0OTYwMzAwNWMwZDlhZDA5ZWIxOGIxZDNlNWM5YzIwMmNlMWM4ZjRmZmZlOTNlMjVhOTg2MTQxYzUwNDUyMDAzYzE3Y2ExNmE5N2FkOGQ2ZjAyYTI1Y2YxOTBmYzk0ZjI1MTk0MDRiNzUzYzk2YzUxYjY3ZTMzNjVkYWY3NGVlYmU2MzNjMTcyZTEzNDYxZTA4ZDg1ODQxMTc0NjIwYjUxZTFiZjkxNjRjNTExMzAzNDkwMDliZGUwMDMwYmM2MDUzNWZkYzI3MmU5Mjc3MWY1NmVkYzc5MGY4NjEzMzZkNmU1OTczZWM4NTc4YWU1MWQ3ZTg5NzA1NTZiNzNiYjQ2MmIifSwibS80NCcvNjAnLzAnLzAvMCI6eyJhZGRyZXNzIjoiYjhjNTEyODg5NDNhYmE2NjY0OGM0MmQ3MTE1MzM1M2E2N2VlOGIwYSIsImNsaWVudF9zZWNyZXRfc2hhcmUiOiJkYjY1ODdhZWE2MDMwOTNmMWI3OWZkOTFhOGQ3MmNjMmIwYjg4OTJiNGI3ZTA3MWYzZDZiZjI0OGYzMDdhZGNjIiwicHVibGljX2tleSI6IjA0OGI2OWM1NWU4YzJiMzgwODYyZTlmMWExNWMxY2Y2YmJlZmVmMjQ3M2NmODcxOThlOTcxMmQ5OTY4YjNiMDM0MjhhOWY2MjEwMzFmMTkyNTUyNTUxMmE1YzUzZmYzMDg3ZDkxYTBiMzg4ZDFhZWRhMTEyZjQ2YzlkY2I3MjViYTciLCJzZXJ2ZXJfc2VjcmV0X3NoYXJlX2VuY3J5cHRlZCI6IjE4YTExOWJkODcxOGE3YTBkYTUyMTdiOGNmNWU2ZDk3ZTE1NzZjMDA2ZTViOGRlYmYxM2IyMjJkMzIxZTA3OWUzMzZiYzFiYzEwMmY5NDg4ZTA4MjYzZWRjMWUyYjZiMWVhMDMwOGE2YjBiM2I3ZDJjZTk4ZWIxMzYwNGY0NTA1OWRjYTNjYmUwM2U3ZDU0ZDdiYzc4MDQzNWYwZTM4NjY1MzkyMmQ1MTE0MDM1NjE5MzdiYTFhNjc3MmMyYWQ1Nzk1ZmFhNzc1ZTc0NmE0OGIzMTI2MGRjNWZiZDBkODk3ZWYwMTU3MzIyMzQ4NjI3ZDgyOGU2NWIzOTc2YzgwYTEyZmM5MGIwZGJiZTEyYTcwNGQ0YWM4OTFmMGVjNzgyOTRiNmU0OWFlNmY5YWMyYjViNDc4MjM3NjBiNjI2MTdiNDRjMzVmMDFiNTRlY2M2ZjYzMDBkM2NjNDZlM2IyOThjZjYzMTI2N2ViZTlmZGZhOTFlNmU3NjRkMzM2MDZjNmY1NGRjOTc4NmYxZmU0ZWZlYTY4NmM4OTZlNmIxNzdjMmZjOWYxNzRiNWRiMTAwOGZlOTYyNWY1MDExMDM1MmRlODgyYzk0YmE2NWQzNGRiNzA1Y2Y5MzYyODI2ODhlMDYzMzdmMWY5MTQ0NzE4NGQ2ZDMwZTc1M2E1YTczMzM5MDJhNzA2MjMyYWVjODE1MTM4ZDViZThjYjZlNDVlYTMwMTY3ZDU3MGRhMzkzMGM5NjM2ODFiODRmNzQ4NDZlNTBmNzMyNzY2M2IzZWI0NTYyMTY2ZmI2OTViYTM3YjViOTU3NmU3Y2E4MGUwOGNiYmU2YTk4ZWRmMzUxYjc0YTA3MTNiMWEzNjMxNTRmMzAzZDBmNmY1NjMwY2M5N2VmMmJjMTg2MGY4MzRmM2Q1NzIwYzY1OGQ3M2UzNTM5YzllMjM5ZmFmMzBkZmFhZjQzMWIyODNkZTEwNmI3NmQxY2FkYmM5Yjk1MTdlMDJmNTBkNzkwOTJkODI1MmE2MTYyYmRhYmNhZTM0MjdiZTZiZTJhYjRlMDA2MzlhNjM0NTk2MjEyZjAwZTQyYWQ1NzBjZjcyOTlkNTlhMmNjODllZTljMDJiOGFiYjY2ZDk0NWIzNzRhN2RjYjFkZTE3ZjkyYzBmYzcwNTIwZTc4ZWZlNDY1NTU5NDk0MTkxODMwYmM0ZmMxM2I0YTgxYzQ3NzBkMTdkYmRlMzMyZmU1NDIwMDJlNjk4YjQ1OWI1MDI3MjUzY2VlMmM1N2U0YWNiZmYyMDAzODE4NzEwNjExMjM5OGRhYzUxMGEwOWRkZGZkODdmYjliNDM4ZTA4NzM1MzkxZTY5ZDc5MTYwZTU4OGE5NDgifSwibS80NCcvODg4Jy8wJy8wLzAiOnsiYWRkcmVzcyI6IkFRQXZlUExTTGg1ZWRHVzRpamtXY2V0d2hwRnFySzVVVGUiLCJjbGllbnRfc2VjcmV0X3NoYXJlIjoiZTAwYTMwNWQzMTQxZWVlZGQ4YjU2ZGNlZjQwNTExZWMzZTFkMzlhMjdiYzc1NjcwNjRmZmRiMzAxZTE1YTBlNiIsInB1YmxpY19rZXkiOiIwMmIwYzM2ZjRjM2MyZWU0MThlNzNiYWUyMTUxODIyNmVmYmJkYjUyNmE2Zjg3YzJlZDRkNWQyNzFjN2JjZDM5N2UiLCJzZXJ2ZXJfc2VjcmV0X3NoYXJlX2VuY3J5cHRlZCI6IjFhYWIyNTE0ODcxMTE3ZDZjOTZmODgxNWFhOTBjMWE2MmYxMGJjMTI5MmYwODA2NTEwZmRjMTQ5Mzk5NTk3NzNhNTI4OTUxY2E2Y2I4NDg0ZTI5MzA0MTQ3NGZjNTIxMjY1NTdiZTM3YTA4MjJlYTY4ZDE2Y2U2MzEwYmU0MDA5Zjc2NzIxZmIxYjZjOGEwMjYwZWQyYTU4NTQ1YzIyMWIyODc3YjFjNWVjY2I2Y2ZlZDFjZDI1ZDhlYmExOTdmMTdlMmIyYTM4ZmM4NzcyZmVhMTdmMWY2OWExNmQ5ZmM1NTBiMWM0MzQ2NTgyY2FhN2U1MzZmZDBiZGNiZDM1MmE4MjJlY2M5ZjRmZGJhMzZjYTkxMWU0ZDE4Mjk1OWNjMmMzYTU4NzM2YjliMmUyOGQyYTk5ZWNhNzQwMTE0Y2M5NTkzNjNkMDdmOGRmMzZmZGFlMWJjNmNlMGUyY2JhYjg4ZTVkYTEzMDM5NGU3NmUzYWRjYWZjNzAwMTc0NTRjZmEwZDZhYWI5M2JlNjVhODU4MWFhZjkyNTFiOTJiNGU2NjJjZjM0NDI4OWYxNzlkMTE5NjU4N2Q1ZTEzY2M3YTMwMGE3OTk4YmNkOWI3MDMyYzcwYWVlZmU1OTU3YTZkZTNjZDY4YTA0MmY0MTY1ZTU1ZTQ2ZDA1ZGQ1ZWM3YWJkZTdkOGRiNDdmZDcyNjFmMzY2Yjg4NjEzMTg2MzkwODdlNzg4YmYxMGU3NmUzMjEwMGQ4NzNjMmNhNjI2YjZmMDlmM2M2Mjc4YzliNDEwZGMzYmI2NzI2NDdjNDMwOTc0YTM0NjQ4MjBjN2M2M2UyYjJkMDRlOWVhNmFiNWY1Y2Q5NTJiM2Y3YTc3ODM4NDdmYTBiNDRiYjgyMTQxZGMzNTFkMTYzYjUwYTA0ZjIyZmZhNDZiNzMyMzVjMWUxNjdjMGUwYWY0MmJmMjljOTMzMWIzZmEzYjkzYTA3NmY2OTU5MmE3MzA5NGJlMmI3ZjBiNGZlOWU4MDgwODMyZGIwMDliYTYwNDMyOWJiNTM3NDdmZTc2Yzk5OGQ4MTZhMGJmNDk4NzNkNDgwMjY3ZDY4NGZiYjZlNTI2OTkzMjJiNzQ2MzMyMTc4OTlhMTZmMDU2YzllMGU2MTFkZmM5MTdjYWNkMzljNzhkYTA5ZmE4ZWFkMmVkNDA0ZjYzYTE3OGQ4MWM4YzAzOTdjMjVlODg4Nzg0NmI1MTc3Yjc4YzgzYmI0NmU1OGExMzdiOTViM2JiYjc3ZmUwM2FiMmMyYWFlMWJiZmVjOTQ5ZmE2MjhkMjc3MTZlY2UxNDMxMWM2NDIzZmUyYjNkOWY3MjgwMzY5N2ZiOThjOTA5MzlhNzg0YTAifX0sInBhaWxsaWVyX3BrIjp7Im4iOiI1ZTA4ZjJkNjIzOTU2NzFlMjdjNzJlOWNjNzRlOGUyYzY4YmJmMWU4ZWU0N2VkNjg1NWY5NTIyMTY3Yjk2MGRhNTk5ZGIyYWU1MWEwMjhiNzAzNDkwN2Q2YzdiMjljZGYyMjljNWYyYjRhODc3YTczNzFiNjgyZTA5NmYyZGVhM2RiYTI5NWZhYzMyZmZjN2VjYjYzYzY1NDNhOTRjZWNkMTMxODMyYzUxMTNmZDA1OTgxZWZjNDVhMTc4N2VlM2U2ODZlNzQyMGRhNDhkOTlkZjNiNjBhY2M0MmEzMzBkMDI4ZjFmZTE3MzRkMmViMjBhNmNiZGRiYWNiYjA0YmZiNzI2MjA3NDk1ZTQ1MGMzYzg2MDg5MGZjOTkzMGRhNzZiMGQ0Y2YxZjhiMThlNjNiOTg3ODlhZWQ0NjUwZTBhNTU1MWY2ZjdjNDg5NmNjYmM3OWRmNzEyYjAzNjUxNzc4ZWYyNzc3MmM3NzZlYTVlMzBkODIyNjEzNzAzZWIxZDg4NDIxNTMxMGIwZmVhYzNmODBiZGQwMDYyMzdlNTFmOGIzZDk3MzYxN2MyMTNlNzZjYTg4MDIxNWQ3NmM0YjBlNjVhMjhkNTA4Mzk3NzFlMmY4ZTNkZDU3NDRhMzBiZTUxMmNiNzMyOWI2MDI5ZDhiNDIxNDcyNTdkNDI4Yjc0OSJ9LCJwYXlsb2FkX3B1YmxpY19rZXkiOiIwMzA0ZmJiYTA1ZWViOGM5ZGExOTk5NGIzZDM4ZDYzMjNlMjVlNjQzODVmMjQwNGZlMDljNTdiMjg2MGMyYmZmMDAiLCJwYXlsb2FkX3NpZ25pbmdfa2V5IjoiZjk2Y2E3NTExYWNkMzcwZjJkMDBjMWIzZDZjZmQ2ZDA5MTQ2Y2IyMmQwZGNjZDJjZTRiY2M3MzU2YWUxYmNjZCIsInZlcnNpb24iOjB9',
      apiKey: '2d0576d1-c1c4-4d0e-b2fb-5393a22f6f88'
    }
    const market = (await client.login(loginData as undefined)) as FailResult
    expect(market.type).toBe('error')
    expect(market.message).toBe('Could not update traded asset nonces: {}')
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
