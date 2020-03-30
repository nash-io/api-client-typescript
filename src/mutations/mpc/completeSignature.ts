import gql from 'graphql-tag'
import { Blockchain } from '@neon-exchange/nash-protocol'

export enum CompletePayloadSignatureType {
  Blockchain = 'BLOCKCHAIN',
  Movement = 'MOVEMENT'
}

export const COMPLETE_PAYLOAD_SIGNATURE = gql`
  mutation completePayloadSignature(
    $blockchain: BlockchainName!
    $payload: Base16!
    $type: CompletePayloadSignatureType!
    $public_key: Base16!
    $r: Base16!
    $signature: Base16!
  ) {
    completePayloadSignature(
      blockchain: $blockchain
      payload: $payload
      publicKey: $public_key
      r: $r
      type: $type
      signature: $signature
    ) {
      signature
    }
  }
`

export interface CompletePayloadSignatureArgs {
  blockchain: Blockchain
  payload: string
  public_key: string
  r: string
  signature: string
  type: CompletePayloadSignatureType
}

export interface CompletePayloadSignatureResult {
  signature: string
}
