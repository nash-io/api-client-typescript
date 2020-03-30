import gql from 'graphql-tag'
import {
  MovementTypeDeposit,
  MovementTypeWithdrawal
} from '@neon-exchange/nash-protocol-mpc'

import { ClientSignedState } from '../stateSyncing/fragments'
import { CurrencyAmount, Signature } from '../../types'

export const PREPARE_MOVEMENT_MUTATION = gql`
  mutation prepareMovement(
    $payload: PrepareMovementParams!
    $signature: Signature!
  ) {
    prepareMovement(payload: $payload, signature: $signature) {
      recycledOrders {
        blockchain
        message
      }
      nonce
      transactionElements {
        digest
      }
      fees {
        currency
        amount
      }
    }
  }
`

export interface TransactionElement {
  digest: string
}

export interface PrepareMovement {
  recycledOrders: ClientSignedState[]
  nonce: number
  transactionElements: TransactionElement[]
  fees: CurrencyAmount
}

export interface PrepareMovementData {
  prepareMovement: PrepareMovement
}

export interface PrepareMovementVariables {
  payload: {
    address: string
    quantity: CurrencyAmount
    timestamp: number
    type: typeof MovementTypeDeposit | typeof MovementTypeWithdrawal
  }
  signature: Signature
}
