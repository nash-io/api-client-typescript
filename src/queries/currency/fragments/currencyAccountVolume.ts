import gql from 'graphql-tag'

import { CURRENCY_AMOUNT_FRAGMENT } from '../../currency/fragments'

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