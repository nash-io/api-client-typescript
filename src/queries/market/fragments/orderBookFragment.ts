import gql from 'graphql-tag';

import { ORDERBOOK_RECORD_FRAGMENT } from './orderBookRecordFragment';

export const ORDERBOOK_FRAGMENT = gql`
  fragment marketOrderbookFields on OrderBook {
    asks {
      ...marketOrderbookRecordFields
    }
    bids {
      ...marketOrderbookRecordFields
    }
  }
  ${ORDERBOOK_RECORD_FRAGMENT}
`;
