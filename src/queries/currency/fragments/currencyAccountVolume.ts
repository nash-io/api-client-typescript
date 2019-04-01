import gql from 'graphql-tag'

import { CryptoCurrency } from '../../../constants/currency'
import { CurrencyAmount, CURRENCY_AMOUNT_FRAGMENT } from '../../currency/fragments'

export interface CurrencyAccountVolume {
    currency: CryptoCurrency,
    thirtyDayVolume: CurrencyAmount,
    thirtyDayVolumePercent: number
}

export const CURRENCY_ACCOUNT_VOLUME_FRAGMENT = gql`
  fragment currencyAccountVolumeFields on CurrencyAccountVolume {
    currency
    thirtyDayVolume {
        ...currencyAmountFields
    }
    thirtyDayVolumePercent
  }
  ${CURRENCY_AMOUNT_FRAGMENT}
`