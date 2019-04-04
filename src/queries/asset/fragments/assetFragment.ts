import gql from 'graphql-tag'

export const ASSET_FRAGMENT = gql`
  fragment assetFields on Asset {
    blockchain
    blockchainPrecision
    depositPrecision
    hash
    name
    symbol
    withdrawalPrecision
  }
`