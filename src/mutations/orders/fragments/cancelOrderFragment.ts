import gql from 'graphql-tag'

export interface CanceledOrder {
    orderId: string
}

export const CANCELED_ORDER_FRAGMENT = gql`
  fragment canceledOrderFields on CanceledOrder {
    orderId
  }
 `
