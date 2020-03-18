import gql from 'graphql-tag'
import { TRADE_FRAGMENT } from '../queries/market/fragments/tradeFragment'
export const NEW_ACCOUNT_TRADES = gql`
  subscription newAccountTrades($payload: NewAccountTradesParams!) {
    newAccountTrades(payload: $payload) {
      ...tradeFields
    }
  }
  ${TRADE_FRAGMENT}
`
