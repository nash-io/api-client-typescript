import gql from 'graphql-tag';
import { ORDERBOOK_FRAGMENT } from './fragments';

export const GET_ORDERBOOK = gql`
  query GetOrderBook($marketName: MarketName!) {
    getOrderBook(marketName: $marketName) {
      ...marketOrderbookFields
    }
  }
  ${ORDERBOOK_FRAGMENT}
`;
