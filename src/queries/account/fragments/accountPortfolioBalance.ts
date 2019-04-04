import gql from 'graphql-tag'
import { Asset } from '../../../types'
import { ASSET_FRAGMENT } from '../../asset/fragments'

export interface AccountPortfolioBalance {
  allocation: number
  asset: Asset
  fiatPrice: number
  fiatPriceChange: number
  fiatPriceChangePercent: number
  total: number
  totalFiatPrice: number
  totalFiatPriceChange: number
}

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