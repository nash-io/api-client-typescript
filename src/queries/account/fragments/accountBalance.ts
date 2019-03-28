import gql from 'graphql-tag'

import { CryptoCurrency } from '../../../constants/currency'
import keyBy from 'lodash/keyBy'
import {
    CurrencyAmount,
    CURRENCY_AMOUNT_FRAGMENT
} from '../../currency/fragments'
import { ASSET_FRAGMENT, Asset } from '../../asset/fragments'

export interface AccountBalance {
    asset: Asset
    available: CurrencyAmount
    inOrders: CurrencyAmount
    pending: CurrencyAmount
    personal: CurrencyAmount
    depositAddress: string
}

export type AccountBalances = AccountBalance[]
export type AccountBalancesMap = Partial<Record<CryptoCurrency, AccountBalance>>

export const getAccountBalancesMap = (
    listAccountBalances: AccountBalances
): AccountBalancesMap => keyBy(listAccountBalances, 'asset.symbol')

export const ACCOUNT_BALANCE_FRAGMENT = gql`
  fragment accountBalanceFields on AccountBalance {
    available {
      ...currencyAmountFields
    }
    inOrders {
      ...currencyAmountFields
    }
    pending {
      ...currencyAmountFields
    }
    personal {
      ...currencyAmountFields
    }
    asset {
      ...assetFields
    }
    depositAddress
  }
  ${CURRENCY_AMOUNT_FRAGMENT}
  ${ASSET_FRAGMENT}
`