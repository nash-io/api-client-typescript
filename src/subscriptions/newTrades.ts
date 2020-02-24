import gql from 'graphql-tag'
import { TRADE_FRAGMENT } from '../queries/market/fragments/tradeFragment'
export const NEW_TRADES = gql`
  subscription NewTrades($marketName: MarketName!) {
    newTrades(marketName: $marketName) {
      ...tradeFields
    }
  }
  ${TRADE_FRAGMENT}
`
