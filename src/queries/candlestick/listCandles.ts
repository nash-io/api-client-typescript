import gql from 'graphql-tag';

import { CANDLE_FRAGMENT } from './fragments/candleFragment';

export const LIST_CANDLES = gql`
  query listCandles(
    $before: DateTime
    $interval: CandleInterval
    $marketName: MarketName!
    $limit: Int
  ) {
    listCandles(
      before: $before
      interval: $interval
      marketName: $marketName
      limit: $limit
    ) {
      candles {
        ...candleFields
      }
    }
  }
  ${CANDLE_FRAGMENT}
`;
