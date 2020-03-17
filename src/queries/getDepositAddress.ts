import gql from 'graphql-tag'

export const GET_DEPOSIT_ADDRESS = gql`
  query getAccountAddress($payload: GetAccountAddressParams!) {
    getAccountAddress(payload: $payload) {
      address
      currency
      vins {
        n
        txid
        value {
          amount
          currency
        }
      }
    }
  }
`
