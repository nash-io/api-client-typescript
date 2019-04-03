import { Client } from '../client'

const client = new Client

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
    const orders = await client.listAccountOrders()
    console.log(orders)
})