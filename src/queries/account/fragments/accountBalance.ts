import gql from 'graphql-tag'

import { CURRENCY_AMOUNT_FRAGMENT } from '../../currency/fragments'
import { ASSET_FRAGMENT } from '../../asset/fragments'

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
    staked {
      ...currencyAmountFields
    }
    total {
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
