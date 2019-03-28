import gql from 'graphql-tag'

export interface Confirmations {
  numerator: number
  denominator: number
}

export const CONFIRMATIONS_FRAGMENT = gql`
  fragment confirmationsFields on Confirmations {
    numerator
    denominator
  }
`