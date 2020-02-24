import gql from 'graphql-tag'
import { TICKER_FRAGMENT } from '../queries/market/fragments'
export const UPDATED_TICKERS = gql`
  subscription UpdatedTickers {
    updatedTickers {
      ...tickerFields
    }
  }
  ${TICKER_FRAGMENT}
`
