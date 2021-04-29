import gql from 'graphql-tag'
import { Blockchain } from '@neon-exchange/nash-protocol'


export const GET_BLOCKCHAIN_FEES = gql`
  query blockchainFees($blockchain: Blockchain!) {
    getBlockchainFees(blockchain: $blockchain) {
      blockchain
      index
      priceLow
      priceHigh
      priceMedium
    }
  }
`

export interface BlockchainFees {
  blockchain: Blockchain
  index: number
  priceLow: number
  priceHigh: number
  priceMedium: number
}
