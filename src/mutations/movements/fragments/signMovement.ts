import gql from 'graphql-tag'
import { MOVEMENT_FRAGMENT } from './movement'

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