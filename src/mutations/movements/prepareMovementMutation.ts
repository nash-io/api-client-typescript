import gql from 'graphql-tag'

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
    }
  }
`

// export interface TransactionElement {
//   digest: string
// }

// export interface PrepareMovement {
//   recycledOrders: ClientSignedState[]
//   nonce: number
//   transactionElements: TransactionElement[]
// }

// export interface PrepareMovementData {
//   prepareMovement: PrepareMovement
// }

// export interface PrepareMovementVariables {
//   payload: {
//     address: string
//     quantity: CurrencyAmount
//     timestamp: number
//     type: MovementType
//   }
//   signature: Signature
// }
