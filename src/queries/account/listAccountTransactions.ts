import gql from 'graphql-tag'

import {
    ACCOUNT_TRANSACTION_FRAGMENT
} from './fragments/accountTransaction'
import { Signature } from '../../types'

export const LIST_ACCOUNT_TRANSACTIONS = gql`
    query listAccountTransactions(
      $payload: ListAccountTransactionsParams!
      $signature: Signature!
    ) {
      listAccountTransactions(payload: $payload, signature: $signature)
        @connection(key: "listAccountTransactions") {
        nextCursor
        transactions {
          ...accountTransactionFields
        }
      }
    }
    ${ACCOUNT_TRANSACTION_FRAGMENT}
  `

export interface ListAccountTransactionsVariables {
    payload: {
        cursor?: string
        fiatSymbol?: string
        limit?: number
        timestamp: number
    }
    signature: Signature
}