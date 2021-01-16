import { CurrencyAmount, CurrencyPrice } from './currency'
import { Market } from './market'
import { DateTime } from './common'

export interface AccountOrder {
  orders: Order[]
  next: DateTime
}

export interface CancelledOrder {
  orderId: string
}

export interface Order {
  amount: CurrencyAmount
  amountRemaining: CurrencyAmount
  amountExecuted: CurrencyAmount
  oppositeAmountExecuted: CurrencyAmount
  avgExecutedPrice: CurrencyAmount | null
  buyOrSell: OrderBuyOrSell
  cancelAt: number | null
  cancellationPolicy: OrderCancellationPolicy
  id: string
  limitPrice: CurrencyPrice
  market: Market
  placedAt: string
  status: OrderStatus
  stopPrice: CurrencyPrice
  type: OrderType
}

export enum OrderBuyOrSell {
  BUY = 'BUY',
  SELL = 'SELL'
}

export enum OrderCancellationPolicy {
  GOOD_TIL_CANCELLED = 'GOOD_TIL_CANCELLED',
  FILL_OR_KILL = 'FILL_OR_KILL',
  IMMEDIATE_OR_CANCEL = 'IMMEDIATE_OR_CANCEL',
  GOOD_TIL_TIME = 'GOOD_TIL_TIME'
}

export enum OrderStatus {
  OPEN = 'OPEN',
  CANCELLED = 'CANCELLED',
  FILLED = 'FILLED',
  PENDING = 'PENDING'
}

export enum OrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
  STOP_MARKET = 'STOP_MARKET',
  STOP_LIMIT = 'STOP_LIMIT'
}

export interface OrderPlaced {
  id: string
  status: OrderStatus
  ordersTillSignState: number
}

export interface PlaceLimitOrderParams {
  allowTaker: boolean
  amount: CurrencyAmount
  buyOrSell: OrderBuyOrSell
  cancellationPolicy: OrderCancellationPolicy
  limitPrice: CurrencyPrice
  marketName: string
  cancelAt?: DateTime
}
