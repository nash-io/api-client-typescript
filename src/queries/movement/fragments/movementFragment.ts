import gql from 'graphql-tag'

import { CURRENCY_AMOUNT_FRAGMENT } from '../../currency/fragments'

export const MOVEMENT_FRAGMENT = gql`
  fragment movementFields on Movement {
    address
    confirmations
    id
    transactionHash
    fee
    publicKey
    signature
    transactionPayload
    currency
    quantity {
      ...currencyAmountFields
    }
    receivedAt
    status
    type
  }
  ${CURRENCY_AMOUNT_FRAGMENT}
`
