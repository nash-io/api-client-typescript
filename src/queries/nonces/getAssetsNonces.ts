import gql from 'graphql-tag'

import { CryptoCurrency } from '../../constants/currency'

export const GET_ASSETS_NONCES_QUERY = gql`
  query getAssetsNonces(
    $payload: GetAssetsNoncesParams!
    $signature: Signature!
  ) {
    getAssetsNonces(payload: $payload, signature: $signature)
      @connection(key: "getAssetsNonces") {
      asset
      nonces
    }
  }
`

export interface GetAssetsNoncesData {
  getAssetsNonces?: Array<{
    asset: CryptoCurrency
    nonces: number[]
  }>
}
