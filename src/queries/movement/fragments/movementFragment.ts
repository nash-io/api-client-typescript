import gql from 'graphql-tag'
import { DateTime } from '../../../types'
import { CurrencyAmount, CURRENCY_AMOUNT_FRAGMENT } from '../../currency/fragments'
import { CryptoCurrency } from '../../../constants/currency'

export interface Movement {
    address: string
    confirmations: number
    currency: CryptoCurrency
    id: number
    quantity: CurrencyAmount
    receivedAt: DateTime
    status: MovementStatus
    type: MovementType
}

export enum MovementType {
    DEPOSIT = 'deposit',
    WITHDRAWAL = 'withdrawal'
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