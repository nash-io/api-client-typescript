import gql from 'graphql-tag'

import { CryptoCurrency } from '../constants/currency'

export interface AccountDepositAddress {
    address: string,
    currency: CryptoCurrency
}

export const GET_DEPOSIT_ADDRESS = gql`
  query getDepositAddress(
    $payload: GetDepositAddressParams!
    $signature: Signature
  ) {
    getDepositAddress(payload: $payload, signature: $signature)
      @connection(key: "getDepositAddress") {
      address
      currency
    }
  }
`