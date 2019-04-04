import { Client } from '../client'
import { CryptoCurrency } from '../constants/currency'

const client = new Client

beforeAll(async () => {
    const email = 'test@nash.io'
    const password = 'af0782580bb2ec65b72cb184cf729dd16dfd5669ae247c64aa8d6d01b6ed8a34'

    await client.login(email, password)
})

test('successfull logs in a user', async () => {
    const email = 'test@nash.io'
    const password = 'af0782580bb2ec65b72cb184cf729dd16dfd5669ae247c64aa8d6d01b6ed8a34'

    await expect(client.login(email, password)).resolves.toBeTruthy
})

test('unsuccessfully logs in a user with invalid credentials', async () => {
    const email = 'test_invalid@nash.io'
    const password = 'af0782580bb2ec65b72cb184cf729dd16dfd5669ae247c64aa8d6d01b6ed8a34'

    await expect(client.login(email, password)).rejects.toThrow(Error)
})

test('list all available markets', async () => {
    const markets = await client.listMarkets()
    expect(markets).toHaveLength(4)
})

test('get a valid market', async () => {
    const market = await client.getMarket('eth_neo')
    expect(market).toBeDefined()
})

test('get a non-existing market throws error', async () => {
    await expect(client.getMarket('ETH_NASH')).rejects.toThrow(Error)
})

test('list account orders', async () => {
    const accountOrder = await client.listAccountOrders()
    expect(accountOrder.orders).toHaveLength(0)
})

test('list account transactions', async () => {
    const accountTransactionResponse = await client.listAccountTransactions()
    expect(accountTransactionResponse.transactions).toHaveLength(0)
})

test('list account balances', async () => {
    const accountBalances = await client.listAccountBalances()
    expect(accountBalances.length).toBeGreaterThan(0)
})

test('get deposit address', async () => {
    const depositAddress = await client.getDepositAddress(CryptoCurrency.ETH)
    expect(depositAddress.currency).toBe('eth')
    expect(depositAddress.address).toBeDefined()
})

test('get account portfolio', async () => {
    const accountPortfolio = await client.getAccountPortfolio()
    expect(accountPortfolio.balances.length).toBeGreaterThan(0)
})

test('get movement that not exist throws', async () => {
    await expect(client.getMovement(1)).rejects.toThrow(Error)
})

test('get account balance', async () => {
    const accountBalance = await client.getAccountBalance(CryptoCurrency.NEO)
    expect(accountBalance.available.amount).toBe('1000.00000000')
})

test('get account order that not exist throws', async () => {
    await expect(client.getAccountOrder('1')).rejects.toThrow(Error)
})