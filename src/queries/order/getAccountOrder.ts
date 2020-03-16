import gql from 'graphql-tag'

import { ORDER_FRAGMENT } from './fragments'

export const GET_ACCOUNT_ORDER = gql`
  query GetAccountOrder($payload: GetAccountOrderParams!) {
    getAccountOrder(payload: $payload) {
      ...orderFields
    }
  }
  ${ORDER_FRAGMENT}
`
