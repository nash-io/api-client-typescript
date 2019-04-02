import gql from 'graphql-tag'
import { MOVEMENT_FRAGMENT, Movement } from './movement'

export interface SignMovement {
    movement: Movement
    publicKey: string
    signature: string
}

export const SIGN_MOVEMENT_FRAGMENT = gql`
  fragment signMovementFields on SignMovementResponse {
    movement {
      ...movementFields
    }
    publicKey
    signature
  }
  ${MOVEMENT_FRAGMENT}
`