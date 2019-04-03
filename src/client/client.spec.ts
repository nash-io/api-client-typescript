import { Client } from '../client'
import { CryptoCurrency } from '../constants/currency'

test('client do something', async () => {
    const client = new Client

    await client.login('anthony1@nash.io', 'af0782580bb2ec65b72cb184cf729dd16dfd5669ae247c64aa8d6d01b6ed8a34')
    const orderPlaced = await client.signWithdrawRequest('b956f2c8d71f71e56e671d6ba22b31d5ea4decfa', { currency: CryptoCurrency.ETH, amount: '2.10000000' })
    console.log(orderPlaced)
    // // const transactions = await client.listAccountTransactions('1', 'eur', 1)
    // const movements = await client.listMovements(CryptoCurrency.AOA)
    // console.log(movements)
    // // console.log(transactions)
})
