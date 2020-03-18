import gql from 'graphql-tag'
import { ORDER_FRAGMENT } from '../queries/order/fragments'
export const UPDATED_ACCOUNT_ORDERS = gql`
  subscription UpdatedAccountOrders($payload: UpdatedAccountOrdersParams!) {
    updatedAccountOrders(payload: $payload) {
      ...orderFields
    }
  }
  ${ORDER_FRAGMENT}
`
