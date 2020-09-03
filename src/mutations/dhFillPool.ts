import gql from 'graphql-tag'
import { Blockchain } from '@neon-exchange/nash-protocol-legacy'

export const DH_FIIL_POOL = gql`
  mutation dhFillRPool($blockchain: Blockchain!, $dhPublics: [Base16]!) {
    dhFillPool(dhPublics: $dhPublics, blockchain: $blockchain)
  }
`

export interface DHFillPoolArgs {
  dhPublics: string[]
  blockchain: Blockchain
}

export interface DHFillPoolResp {
  dhFillPool: string[]
}
