import gql from 'graphql-tag'

import { SyncState } from '@neon-exchange/nash-protocol-mpc'

export const GET_ORDERS_FOR_MOVEMENT_QUERY = gql`
  query getOrdersForMovement(
    $payload: GetOrdersForMovementParams!
    $signature: Signature!
  ) {
    getOrdersForMovement(payload: $payload, signature: $signature) {
      recycledOrders {
        blockchain
        message
      }
      assetNonce
    }
  }
`

export interface OrdersForMovementData {
  recycledOrders: SyncState[]
  assetNonce: number
}

export interface GetOrdersForMovementData {
  getOrdersForMovement: {
    recycledOrders: SyncState[]
    assetNonce: number
  }
}
