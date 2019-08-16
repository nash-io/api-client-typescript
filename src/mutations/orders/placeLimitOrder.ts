import gql from 'graphql-tag'

import { ORDER_PLACED_FRAGMENT } from './fragments'

export const PLACE_LIMIT_ORDER_MUTATION = gql`
  mutation placeLimitOrder(
    $payload: PlaceLimitOrderParams!
    $signature: Signature!
  ) {
    placeLimitOrder(payload: $payload, signature: $signature) {
      ...orderPlacedFields
    }
  }
  ${ORDER_PLACED_FRAGMENT}
`
