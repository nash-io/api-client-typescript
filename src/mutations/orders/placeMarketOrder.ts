import gql from 'graphql-tag'

import { ORDER_PLACED_FRAGMENT } from './fragments'

export const PLACE_MARKET_ORDER_MUTATION = gql`
  mutation placeMarketOrder(
    $affiliateDeveloperCode: AffiliateDeveloperCode
    $payload: PlaceMarketOrderParams!
    $signature: Signature!
  ) {
    placeMarketOrder(
      affiliateDeveloperCode: $affiliateDeveloperCode
      payload: $payload
      signature: $signature
    ) {
      ...orderPlacedFields
    }
  }
  ${ORDER_PLACED_FRAGMENT}
`
