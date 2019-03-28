import gql from 'graphql-tag'
import { Blockchain } from '../../../types'
import { CryptoCurrency } from '../../../constants/currency'

export interface Asset {
    blockchain: Blockchain
    blockchainPrecision: number
    depositPrecision: number
    hash: string
    name: string
    symbol: CryptoCurrency
    tradeable: boolean
    withdrawalPrecision: number
}

export const ASSET_FRAGMENT = gql`
  fragment assetFields on Asset {
    blockchain
    blockchainPrecision
    depositPrecision
    hash
    name
    symbol
    tradeable
    withdrawalPrecision
  }
`