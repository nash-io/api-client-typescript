import gql from 'graphql-tag'
import { CryptoCurrency } from '../../constants/currency'

export const GET_ACCOUNT_ADDRESS = gql`
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

export interface GetAccountAddressParams {
  payload: {
    currency: CryptoCurrency
  }
}
export interface GetAccountAddressResult {
  getAccountAddress: {
    address: string
    currency: CryptoCurrency
    vins: Array<{
      n: number
      txid: string
      value: {
        amount: string
        currency: string
      }
    }>
  }
}
