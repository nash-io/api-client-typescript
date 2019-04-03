import gql from 'graphql-tag'
import {
  CURRENCY_AMOUNT_FRAGMENT
} from '../../../queries/currency/fragments'
import { CryptoCurrency } from '../../../constants/currency'
import { DateTime, CurrencyAmount } from '../../../types'

export enum MovementType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL'
}

export enum MovementStatus {
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PENDING = 'PENDING'
}

export interface Movement {
  address: string
  confirmations: number
  id: number
  currency: CryptoCurrency
  quantity: CurrencyAmount
  receivedAt: DateTime
  status: MovementStatus
}

export const MOVEMENT_FRAGMENT = gql`
  fragment movementFields on Movement {
    address
    confirmations
    id
    currency
    quantity {
      ...currencyAmountFields
    }
    receivedAt
    status
  }
  ${CURRENCY_AMOUNT_FRAGMENT}
`