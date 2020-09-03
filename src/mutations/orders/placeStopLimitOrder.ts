import gql from 'graphql-tag'

import { ORDER_PLACED_FRAGMENT } from './fragments'

export const PLACE_STOP_LIMIT_ORDER_MUTATION = gql`
  mutation placeStopLimitOrder(
    $affiliateDeveloperCode: AffiliateDeveloperCode
    $payload: PlaceStopLimitOrderParams!
    $signature: Signature!
  ) {
    placeStopLimitOrder(
      affiliateDeveloperCode: $affiliateDeveloperCode
      payload: $payload
      signature: $signature
    ) {
      ...orderPlacedFields
    }
  }
  ${ORDER_PLACED_FRAGMENT}
`
