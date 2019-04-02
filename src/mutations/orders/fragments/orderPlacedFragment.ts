import gql from 'graphql-tag'
import { OrderStatus } from '../../../queries/order/fragments'

export interface OrderPlaced {
    id: string
    status: OrderStatus
}

export const ORDER_PLACED_FRAGMENT = gql`
  fragment orderPlacedFields on OrderPlaced {
    id
    status
  }
`