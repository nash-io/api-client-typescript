import gql from 'graphql-tag'
import {
  MovementTypeDeposit,
  MovementTypeWithdrawal
} from '@neon-exchange/nash-protocol'

import { ClientSignedState } from '../stateSyncing/fragments'
import { CurrencyAmount, Signature, Blockchain } from '../../types'

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
        blockchain
        digest
        payload
        payloadHash
        payloadHashFunction
        signatureFunction
      }
      fees {
        currency
        amount
      }
    }
  }
`

export interface TransactionElement {
  blockchain: Blockchain
  digest: string
  payload: string 
  payloadHash: string
  payloadHashFunction: string 
  signatureFunction: string
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
    backendGeneratedPayload: boolean
    capQuantityToMaximum?: boolean
    quantity: CurrencyAmount
    targetAddress?: string
    timestamp: number
    type: typeof MovementTypeDeposit | typeof MovementTypeWithdrawal
    
  }
  signature: Signature
}
