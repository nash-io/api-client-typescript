import gql from 'graphql-tag'
import { CANDLE_FRAGMENT } from '../queries/candlestick/fragments/candleFragment'

export const UPDATED_CANDLES = gql`
  subscription UpdatedCandles(
    $interval: CandleInterval!
    $marketName: MarketName!
  ) {
    updatedCandles(marketName: $marketName, interval: $interval) {
      ...candleFields
    }
  }
  ${CANDLE_FRAGMENT}
`

