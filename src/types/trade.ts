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
  accountSide: AccountTradeSides
}

export enum AccountTradeSides {
  NONE = 'none',
  MAKER = 'maker',
  TAKER = 'taker'
}

export interface TradeHistory {
  trades: Trade[]
  next: any
}
export interface NonceSet {
  noncesFrom: number[]
  noncesTo: number[]
  nonceOrder: number
}
