import { CurrencyAmount, CurrencyPrice } from '../types'
import { OrderBuyOrSell } from './order'

export interface Trade {
  id: string
  executedAt: string
  limitPrice: CurrencyPrice
  amount: CurrencyAmount
  direction: OrderBuyOrSell
}

export interface TradeHistory {
  trades: Trade[]
  next: any
}
