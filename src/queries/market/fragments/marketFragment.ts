import gql from 'graphql-tag'

export const MARKET_FRAGMENT = gql`
  fragment marketFields on Market {
    aUnit
    aUnitPrecision
    bUnit
    bUnitPrecision
    minTickSize
    minTradeSize
    name
    status
  }
`