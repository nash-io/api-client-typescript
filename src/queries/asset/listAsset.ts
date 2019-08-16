import gql from 'graphql-tag'

import { ASSET_FRAGMENT } from './fragments'

export const LIST_ASSETS_QUERY = gql`
  query ListAssetsQuery {
    listAssets {
      ...assetFields
    }
  }
  ${ASSET_FRAGMENT}
`
