import { Client } from '../client'


test('client do something', async () => {
    const client = new Client
    await client.init()

    await client.login('anthony1@nash.io', 'af0782580bb2ec65b72cb184cf729dd16dfd5669ae247c64aa8d6d01b6ed8a34')
    // const orders = await client.listOrders()
    // const transactions = await client.listAccountTransactions('1', 'eur', 1)
    const accountBalances = await client.listAccountBalances()
    console.log(accountBalances)
    // console.log(transactions)
})
