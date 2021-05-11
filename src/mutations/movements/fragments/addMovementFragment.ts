import gql from 'graphql-tag'

import { Movement } from '../../../types'

export type AddMovement = Movement
export const ADD_MOVEMENT_FRAGMENT = gql`
  fragment addMovementFields on Movement {
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
    type
    transactionElements {
      blockchain
      digest
      payload
      payloadHash
      payloadHashFunction
      signatureFunction
    }
    targetAddress  
  }
`
