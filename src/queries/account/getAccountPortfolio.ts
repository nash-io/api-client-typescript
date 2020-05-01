import gql from 'graphql-tag'

import {
  ACCOUNT_PORTFOLIO_BALANCE_FRAGMENT,
  GRAPH_POINT_FRAGMENT,
  ACCOUNT_PORTFOLIO_TOTAL_FRAGMENT
} from './fragments'
import { FiatCurrency } from '../../constants/currency'
import { Period } from '../../types'

export const GET_ACCOUNT_PORTFOLIO = gql`
  query getAccountPortfolio($payload: GetAccountPortfolioParams!) {
    getAccountPortfolio(payload: $payload) {
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

export interface GetAccountPortfolioParams {
  fiatSymbol?: FiatCurrency
  period?: Period
}
