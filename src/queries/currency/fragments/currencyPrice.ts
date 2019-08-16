import gql from 'graphql-tag'

export const CURRENCY_PRICE_FRAGMENT = gql`
  fragment currencyPriceFields on CurrencyPrice {
    amount
    currencyA
    currencyB
  }
`
