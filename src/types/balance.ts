import { Asset, CurrencyAmount } from '../types'

export interface AccountBalance {
  asset: Asset
  available: CurrencyAmount
  inOrders: CurrencyAmount
  pending: CurrencyAmount
  personal: CurrencyAmount
  staked: CurrencyAmount
  total: CurrencyAmount
  depositAddress: string
}
