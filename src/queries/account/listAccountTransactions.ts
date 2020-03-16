import gql from 'graphql-tag'

import { ACCOUNT_TRANSACTION_FRAGMENT } from './fragments/accountTransaction'

export const LIST_ACCOUNT_TRANSACTIONS = gql`
  query listAccountTransactions($payload: ListAccountTransactionsParams!) {
    listAccountTransactions(payload: $payload) {
      nextCursor
      transactions {
        ...accountTransactionFields
      }
    }
  }
  ${ACCOUNT_TRANSACTION_FRAGMENT}
`
