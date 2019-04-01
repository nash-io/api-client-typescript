import gql from 'graphql-tag'
import { MARKET_FRAGMENT, Market } from '../../market/fragments'
import {
  CurrencyAmount,
  CurrencyPrice,
  CURRENCY_AMOUNT_FRAGMENT,
  CURRENCY_PRICE_FRAGMENT
} from '../../currency/fragments'

export interface Order {
  amount: CurrencyAmount
  amountRemaining: CurrencyAmount
  buyOrSell: OrderBuyOrSell
  cancelAt: number
  cancellationPolicy: OrderCancellationPolicy
  id: string
  limitPrice: CurrencyPrice
  market: Market
  placedAt: string
  status: OrderStatus
  stopPrice: CurrencyPrice
  type: OrderType
}

export const ORDER_FRAGMENT = gql`
  fragment orderFields on Order {
    amount {
      ...currencyAmountFields
    }
    amountRemaining {
      ...currencyAmountFields
    }
    buyOrSell
    cancelAt
    cancellationPolicy
    id
    limitPrice {
      ...currencyPriceFields
    }
    market {
      ...marketFields
    }
    placedAt
    status
    stopPrice {
      ...currencyPriceFields
    }
    type
  }
  ${CURRENCY_PRICE_FRAGMENT}
  ${CURRENCY_AMOUNT_FRAGMENT}
  ${MARKET_FRAGMENT}
`

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