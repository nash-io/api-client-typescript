import gql from 'graphql-tag'
import { Blockchain } from '@neon-exchange/nash-protocol-legacy'
export interface GQLSignature {
  /**
   * The public key used to generate the signature
   */
  publicKey: string

  /**
   * The signature of the hashed canonical request
   */
  signedDigest: string
}
export const SEND_BLOCKCHAIN_RAW_TRANSACTION = gql`
  mutation sendBlockchainRawTransaction(
    $payload: SendBlockchainRawTransactionParams!
    $signature: Signature!
  ) {
    sendBlockchainRawTransaction(payload: $payload, signature: $signature)
  }
`
interface GQLSendBlockchainRawTransactionParams {
  blockchain: Blockchain
  timestamp: number
  transactionPayload: string
}
export interface SendBlockchainRawTransactionArgs {
  payload: GQLSendBlockchainRawTransactionParams
  signature: GQLSignature
}
export interface SendBlockchainRawTransactionResult {
  sendBlockchainRawTransaction: string
}
