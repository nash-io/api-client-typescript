import gql from 'graphql-tag';

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
`;
