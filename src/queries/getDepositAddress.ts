import gql from 'graphql-tag'

export const GET_DEPOSIT_ADDRESS = gql`
  query getDepositAddress($payload: GetDepositAddressParams!) {
    getDepositAddress(payload: $payload) {
      address
      currency
    }
  }
`
