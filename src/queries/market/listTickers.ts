import gql from 'graphql-tag'

import { TICKER_FRAGMENT } from './fragments'

export const LIST_TICKERS = gql`
  query Tickers {
    listTickers {
      ...tickerFields
    }
  }
  ${TICKER_FRAGMENT}
`
