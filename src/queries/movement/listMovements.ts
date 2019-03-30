import gql from 'graphql-tag'

import { MOVEMENT_FRAGMENT } from './fragments'

export const LIST_ACCOUNT_BALANCES = gql`
  query listMovements(
    $payload: ListMovementParams!
    $signature: Signature
  ) {
    listMovements(payload: $payload, signature: $signature)
      @connection(key: "listMovements") {
      ...movementFields
    }
  }
  ${MOVEMENT_FRAGMENT}
`