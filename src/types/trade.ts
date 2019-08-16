import { CurrencyAmount, CurrencyPrice } from '../types'

export interface Trade {
  id: string
  executedAt: string
  limitPrice: CurrencyPrice
  amount: CurrencyAmount
}

export interface TradeHistory {
  trades: Trade[]
  next: any
}
