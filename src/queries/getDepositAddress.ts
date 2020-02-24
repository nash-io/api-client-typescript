import gql from 'graphql-tag'

export const GET_DEPOSIT_ADDRESS = gql`
  query getDepositAddress(
    $payload: GetDepositAddressParams!
    $signature: Signature
  ) {
    getDepositAddress(payload: $payload, signature: $signature) {
      address
      currency
    }
  }
`
