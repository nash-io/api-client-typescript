import gql from 'graphql-tag'

import {
  CURRENCY_AMOUNT_FRAGMENT
} from '../../../queries/currency/fragments'
import { CryptoCurrency } from 'constants/currency'
import { DateTime,CurrencyAmount } from '../../../types'

export enum MovementType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  TRANSFER = 'TRANSFER'
}

export enum MovementStatus {
  CREATED = 'CREATED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PENDING = 'PENDING'
}

export interface AddMovement {
  address: string
  confirmations: number
  id: number
  currency: CryptoCurrency
  quantity: CurrencyAmount
  receivedAt: DateTime
  status: MovementStatus
  publicKey: string
  signature: string
}

export const ADD_MOVEMENT_FRAGMENT = gql`
  fragment addMovementFields on Movement {
    address
    confirmations
    id
    currency
    quantity {
      ...currencyAmountFields
    }
    receivedAt
    status

    publicKey
    signature
  }
  ${CURRENCY_AMOUNT_FRAGMENT}
`
