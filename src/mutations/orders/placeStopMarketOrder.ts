import gql from 'graphql-tag'

import { ORDER_PLACED_FRAGMENT } from './fragments/index'

export const PLACE_STOP_MARKET_ORDER_MUTATION = gql`
  mutation placeStopMarketOrder(
    $affiliateDeveloperCode: AffiliateDeveloperCode
    $payload: PlaceStopMarketOrderParams!
    $signature: Signature!
  ) {
    placeStopMarketOrder(
      affiliateDeveloperCode: $affiliateDeveloperCode
      payload: $payload
      signature: $signature
    ) {
      ...orderPlacedFields
    }
  }
  ${ORDER_PLACED_FRAGMENT}
`
