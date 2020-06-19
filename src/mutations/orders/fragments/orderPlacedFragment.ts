import gql from 'graphql-tag'

export const ORDER_PLACED_FRAGMENT = gql`
  fragment orderPlacedFields on OrderPlaced {
    id
    status
    ordersTillSignState
  }
`
