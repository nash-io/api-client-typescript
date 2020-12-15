import gql from 'graphql-tag'
import { ACCOUNT_BALANCE_FRAGMENT } from '../queries/account/fragments'
export const UPDATED_ACCOUNT_BALANCE = gql`
  subscription updatedAccountBalances($payload: UpdatedAccountBalancesParams!) {
    updatedAccountBalances(payload: $payload) {
      ...accountBalanceFields
    }
  }
  ${ACCOUNT_BALANCE_FRAGMENT}
`
