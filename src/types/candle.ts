import { CurrencyAmount, CurrencyPrice } from '../types'

export interface Candle {
  aVolume: CurrencyAmount
  closePrice: CurrencyPrice
  highPrice: CurrencyPrice
  interval: CandleInterval
  intervalStartingAt: string
  lowPrice: CurrencyPrice
  openPrice: CurrencyPrice
}

export enum CandleInterval {
  ONE_MINUTE = 'ONE_MINUTE',
  FIFTEEN_MINUTE = 'FIFTEEN_MINUTE',
  THIRTY_MINUTE = 'THIRTY_MINUTE',
  ONE_HOUR = 'ONE_HOUR',
  SIX_HOUR = 'SIX_HOUR',
  TWELVE_HOUR = 'TWELVE_HOUR',
  ONE_DAY = 'ONE_DAY',
  ONE_WEEK = 'ONE_WEEK',
  ONE_MONTH = 'ONE_MONTH'
}

export interface CandleRange {
  candles: Candle[]
}
