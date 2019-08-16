import gql from 'graphql-tag'

import { ASSET_FRAGMENT } from '../../asset/fragments'

export const ACCOUNT_PORTFOLIO_BALANCE_FRAGMENT = gql`
  fragment portfolioBalanceFields on AccountPortfolioBalance {
    allocation
    asset {
      ...assetFields
    }
    fiatPrice
    fiatPriceChange
    fiatPriceChangePercent
    total
    totalFiatPrice
    totalFiatPriceChange
  }
  ${ASSET_FRAGMENT}
`
