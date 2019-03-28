import gql from 'graphql-tag'

import { ACCOUNT_BALANCE_FRAGMENT } from './fragments'
import { Signature } from '../../types'

export const LIST_ACCOUNT_BALANCES = gql`
  query listAccountBalances(
    $payload: ListAccountBalancesParams!
    $signature: Signature
  ) {
    listAccountBalances(payload: $payload, signature: $signature)
      @connection(key: "listAccountBalances") {
      ...accountBalanceFields
    }
  }
  ${ACCOUNT_BALANCE_FRAGMENT}
`

export interface ListAccountBalancesVariables {
    payload: {
        ignoreLowBalance?: boolean
        timestamp: number
    }
    signature: Signature
}
