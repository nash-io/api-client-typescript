import gql from 'graphql-tag'

import { ACCOUNT_BALANCE_FRAGMENT } from './fragments'

export const LIST_ACCOUNT_BALANCES = gql`
  query listAccountBalances($payload: ListAccountBalancesParams!) {
    listAccountBalances(payload: $payload) {
      ...accountBalanceFields
    }
  }
  ${ACCOUNT_BALANCE_FRAGMENT}
`
