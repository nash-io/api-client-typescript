import gql from 'graphql-tag'

import { TRADE_FRAGMENT } from '../market/fragments'

export const LIST_ACCOUNT_TRADES = gql`
  query ListAccountTrades(
    $payload: ListAccountTradesParams!
    $signature: Signature
  ) {
    listAccountTrades(payload: $payload, signature: $signature) {
      next
      trades {
        ...tradeFields
      }
    }
  }
  ${TRADE_FRAGMENT}
`
