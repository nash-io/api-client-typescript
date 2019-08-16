import gql from 'graphql-tag'

export const CANCELED_ORDER_FRAGMENT = gql`
  fragment canceledOrderFields on CanceledOrder {
    orderId
  }
`
