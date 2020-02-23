import gql from 'graphql-tag'
import { ORDERBOOK_FRAGMENT } from '../queries/market/fragments'
export const UPDATED_ORDER_BOOK = gql`
  subscription UpdatedOrderBook($marketName: MarketName!) {
    updatedOrderBook(marketName: $marketName) {
      ...marketOrderbookFields
    }
  }
  ${ORDERBOOK_FRAGMENT}
`
