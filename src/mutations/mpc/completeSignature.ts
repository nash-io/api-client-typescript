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
    $operation: CompletePayloadSignatureOperation!
    $payload: Base16!
    $type: CompletePayloadSignatureType!
    $public_key: Base16!
    $r: Base16!
    $signature: Base16!
  ) {
    completePayloadSignature(
      blockchain: $blockchain
      operation: $operation
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
