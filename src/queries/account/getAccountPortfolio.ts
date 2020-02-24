import gql from 'graphql-tag'

import {
  ACCOUNT_PORTFOLIO_BALANCE_FRAGMENT,
  GRAPH_POINT_FRAGMENT,
  ACCOUNT_PORTFOLIO_TOTAL_FRAGMENT
} from './fragments'

export const GET_ACCOUNT_PORTFOLIO = gql`
  query getAccountPortfolio(
    $payload: GetAccountPortfolioParams!
    $signature: Signature!
  ) {
    getAccountPortfolio(payload: $payload, signature: $signature) {
      balances {
        ...portfolioBalanceFields
      }
      graph {
        ...graphPointFields
      }
      total {
        ...accountPortfolioTotalFields
      }
    }
  }
  ${ACCOUNT_PORTFOLIO_BALANCE_FRAGMENT}
  ${GRAPH_POINT_FRAGMENT}
  ${ACCOUNT_PORTFOLIO_TOTAL_FRAGMENT}
`
