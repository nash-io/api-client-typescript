import gql from 'graphql-tag'

import { CONFIRMATIONS_FRAGMENT } from './confirmations'
import { CURRENCY_AMOUNT_FRAGMENT } from '../../currency/fragments'

export const ACCOUNT_TRANSACTION_FRAGMENT = gql`
  fragment accountTransactionFields on AccountTransaction {
    address
    blockDatetime
    blockIndex
    blockchain
    confirmations {
      ...confirmationsFields
    }
    fiatValue
    status
    txid
    type
    value {
      ...currencyAmountFields
    }
  }
  ${CONFIRMATIONS_FRAGMENT}
  ${CURRENCY_AMOUNT_FRAGMENT}
`
