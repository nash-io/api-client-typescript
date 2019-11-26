import { CurrencyAmount, CurrencyPrice } from '../types'
import { OrderBuyOrSell } from './order'

export interface Trade {
  id: string
  makerOrderId: string
  takerOrderid: string
  executedAt: string
  limitPrice: CurrencyPrice
  amount: CurrencyAmount
  direction: OrderBuyOrSell
  makerGave: CurrencyAmount
  takerGave: CurrencyAmount
  makerReceived: CurrencyAmount
  takerReceived: CurrencyAmount
  makerFee: CurrencyAmount
  takerFee: CurrencyAmount
}

export interface TradeHistory {
  trades: Trade[]
  next: any
}
