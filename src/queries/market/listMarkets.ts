import gql from 'graphql-tag'

import { MARKET_FRAGMENT } from './fragments'

export const LIST_MARKETS_QUERY = gql`
  query ListMarkets {
    listMarkets {
      ...marketFields
    }
  }
  ${MARKET_FRAGMENT}
`