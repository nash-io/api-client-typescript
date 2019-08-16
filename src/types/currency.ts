import { CryptoCurrency } from '../constants/currency'

export interface CurrencyPrice {
  amount: string
  currencyA: CryptoCurrency
  currencyB: CryptoCurrency
}

export interface CurrencyAmount {
  amount: string
  currency: CryptoCurrency
}

export interface CurrencyAccountVolume {
  currency: CryptoCurrency
  thirtyDayVolume: CurrencyAmount
  thirtyDayVolumePercent: number
}
