import gql from 'graphql-tag'

import { ORDER_FRAGMENT } from './fragments'

export const GET_ACCOUNT_ORDER = gql`
  query GetAccountOrder(
    $payload: GetAccountOrderParams!
    $signature: Signature
  ) {
    getAccountOrder(payload: $payload, signature: $signature)
      @connection(key: "getAccountOrder") {
      ...orderFields
    }
  }
  ${ORDER_FRAGMENT}
`
