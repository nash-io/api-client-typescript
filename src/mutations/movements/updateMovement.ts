import gql from 'graphql-tag'
import { Signature, Movement, MovementStatus } from '../../types'

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
  updateMovement: Movement
}

export interface UpdateMovementVariables {
  payload: {
    movementId: string
    transactionHash?: string
    transactionPayload?: string
    status?: MovementStatus
    timestamp: number
    fee: string
  }
  signature: Signature
}
