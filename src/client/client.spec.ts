import { Client } from '../client'
import { CryptoCurrency } from '../constants/currency'
import { OrderBuyOrSell, OrderCancellationPolicy } from '../queries/order/fragments';

test('client do something', async () => {
    const client = new Client
    await client.init()

    await client.login('anthony1@nash.io', 'af0782580bb2ec65b72cb184cf729dd16dfd5669ae247c64aa8d6d01b6ed8a34')
    const orderPlaced = await client.placeStopLimitOrder(
        false,
        { amount: '1', currency: CryptoCurrency.NEO },
        OrderBuyOrSell.SELL,
        OrderCancellationPolicy.GOOD_TIL_CANCELLED,
        { amount: '1', currencyA: CryptoCurrency.ETH, currencyB: CryptoCurrency.NEO },
        'neo_eth',
        { amount: '1', currencyA: CryptoCurrency.ETH, currencyB: CryptoCurrency.NEO }
    )
    console.log(orderPlaced)
    // // const transactions = await client.listAccountTransactions('1', 'eur', 1)
    // const movements = await client.listMovements(CryptoCurrency.AOA)
    // console.log(movements)
    // // console.log(transactions)
})
