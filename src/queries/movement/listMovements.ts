import gql from 'graphql-tag'

import { MOVEMENT_FRAGMENT } from './fragments'

import { MovementType, MovementStatus } from '../../types'
import { CryptoCurrencies } from '../../constants/currency'
export const LIST_MOVEMENTS = gql`
  query listMovements($payload: ListMovementsParams!, $signature: Signature!) {
    listMovements(payload: $payload, signature: $signature) {
      ...movementFields
    }
  }
  ${MOVEMENT_FRAGMENT}
`

export interface ListMovementsParams {
  currency?: CryptoCurrencies | string
  status?: MovementStatus
  type?: MovementType
}
