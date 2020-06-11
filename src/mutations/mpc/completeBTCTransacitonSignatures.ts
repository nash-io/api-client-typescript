import gql from 'graphql-tag'

export const COMPLETE_BTC_TRANSACTION_SIGNATURES = gql`
  mutation completeBtcPayloadSignature(
    $payload: Base16!
    $publicKey: Base16!
    $inputPresigs: [InputPresig!]!
  ) {
    completeBtcPayloadSignature(
      payload: $payload
      publicKey: $publicKey
      inputPresigs: $inputPresigs
    )
  }
`

export interface CompleteBtcTransactionSignaturesArgs {
  inputPresigs: Array<{
    r: string
    signature: string
    amount: number
  }>
  payload: string
  publicKey: string
}

export interface CompleteBtcTransactionSignaturesResult {
  completeBtcPayloadSignature: string[]
}
