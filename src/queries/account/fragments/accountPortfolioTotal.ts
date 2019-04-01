import gql from 'graphql-tag'

export interface AccountPortfolioTotal {
    availableAllocation: number
    availableFiatPrice: number
    inOrdersAllocation: number
    inOrdersFiatPrice: number
    inStakesAllocation: number
    inStakesFiatPrice: number
    pendingAllocation: number
    pendingFiatPrice: number
    personalAllocation: number
    personalFiatPrice: number
    totalFiatPrice: number
    totalFiatPriceChange: number
    totalFiatPriceChangePercent: number
}

export const ACCOUNT_PORTFOLIO_TOTAL_FRAGMENT = gql`
  fragment accountPortfolioTotalFields on AccountPortfolioTotal {
    availableAllocation
    availableFiatPrice
    inOrdersAllocation
    inOrdersFiatPrice
    inStakesAllocation
    inStakesFiatPrice
    pendingAllocation
    pendingFiatPrice
    personalAllocation
    personalFiatPrice
    totalFiatPrice
    totalFiatPriceChange
    totalFiatPriceChangePercent
  }
`