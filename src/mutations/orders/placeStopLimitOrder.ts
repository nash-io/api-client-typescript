import gql from 'graphql-tag'

import { ORDER_PLACED_FRAGMENT } from './fragments'

export const PLACE_STOP_LIMIT_ORDER_MUTATION = gql`
  mutation placeStopLimitOrder(
    $payload: PlaceStopLimitOrderParams!
    $signature: Signature!
  ) {
    placeStopLimitOrder(payload: $payload, signature: $signature) {
      ...orderPlacedFields
    }
  }
  ${ORDER_PLACED_FRAGMENT}
`
