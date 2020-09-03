import gql from 'graphql-tag'

import { ORDER_PLACED_FRAGMENT } from './fragments'

export const PLACE_LIMIT_ORDER_MUTATION = gql`
  mutation placeLimitOrder(
    $affiliateDeveloperCode: AffiliateDeveloperCode
    $payload: PlaceLimitOrderParams!
    $signature: Signature!
  ) {
    placeLimitOrder(
      affiliateDeveloperCode: $affiliateDeveloperCode
      payload: $payload
      signature: $signature
    ) {
      ...orderPlacedFields
    }
  }
  ${ORDER_PLACED_FRAGMENT}
`
