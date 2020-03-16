import gql from 'graphql-tag'

import { ACCOUNT_BALANCE_FRAGMENT } from './fragments'

export const GET_ACCOUNT_BALANCE = gql`
  query getAccountBalance($payload: GetAccountBalanceParams!) {
    getAccountBalance(payload: $payload) {
      ...accountBalanceFields
    }
  }
  ${ACCOUNT_BALANCE_FRAGMENT}
`
