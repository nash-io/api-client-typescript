import gql from 'graphql-tag'

export const CONFIRMATIONS_FRAGMENT = gql`
  fragment confirmationsFields on Confirmations {
    numerator
    denominator
  }
`