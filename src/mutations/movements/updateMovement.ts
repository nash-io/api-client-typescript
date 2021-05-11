import gql from 'graphql-tag'
import { Signature, MovementStatus, CurrencyAmount, DateTime, MovementType } from '../../types'
import { CryptoCurrency } from 'index'

export const UPDATE_MOVEMENT_MUTATION = gql`
  mutation updateMovement(
    $payload: UpdateMovementParams!
    $signature: Signature!
  ) {
    updateMovement(payload: $payload, signature: $signature) {
      address
      confirmations
      id
      currency
      quantity {
        amount
        currency
      }
      receivedAt
      status
      publicKey
      signature
      type
      nonce
      blockchain
      transactionPayload
      transactionHash
      fee
    }
  }
`

export interface UpdateMovementData {
  address: string
  confirmations: number
  currency: CryptoCurrency
  fee: string | null
  id: string
  publicKey: string
  quantity: CurrencyAmount
  receivedAt: DateTime
  signature: string
  status: MovementStatus
  transactionHash: string
  transactionPayload: string
  type: MovementType
}

export interface UpdateMovementVariables {
  payload: {
    movementId: string
    transactionHash?: string
    transactionPayload?: string
    signedTransactionElements?: []
    status?: MovementStatus
    timestamp: number
    fee: string
  }
  signature: Signature
}
