import gql from 'graphql-tag'
import { Blockchain } from '@neon-exchange/nash-protocol'

export enum CompletePayloadSignatureType {
  Blockchain = 'BLOCKCHAIN',
  Movement = 'MOVEMENT'
}

export enum CompletePayloadSignatureOperation {
  Deposit = 'DEPOSIT',
  Transfer = 'TRANSFER',
  Withdrawal = 'WITHDRAWAL'
}

export const COMPLETE_PAYLOAD_SIGNATURE = gql`
  mutation completePayloadSignature(
    $blockchain: Blockchain!
    $payload: Base16!
    $type: CompletePayloadSignatureType!
    $operation: CompletePayloadSignatureOperation!
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
      operation: $operation
      signature: $signature
    ) {
      signature
    }
  }
`

export interface CompletePayloadSignatureArgs {
  blockchain: Blockchain
  operation: CompletePayloadSignatureOperation
  payload: string
  public_key: string
  r: string
  signature: string
  type: CompletePayloadSignatureType
}

export interface CompletePayloadSignatureResult {
  signature: string
}
