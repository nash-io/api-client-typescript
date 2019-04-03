import gql from 'graphql-tag'

import { CryptoCurrency } from '../../../constants/currency'
import { Confirmations, CONFIRMATIONS_FRAGMENT } from './confirmations'
import { CURRENCY_AMOUNT_FRAGMENT } from '../../currency/fragments'
import { TransactionType, CurrencyAmount } from '../../../types'

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed'
}

export interface AccountTransaction {
  address: string
  blockDatetime: string
  blockIndex: number
  blockchain: CryptoCurrency
  confirmations: Confirmations
  fiatValue: number
  status: TransactionStatus
  txid: string
  type: TransactionType
  value: CurrencyAmount
}

export const ACCOUNT_TRANSACTION_FRAGMENT = gql`
  fragment accountTransactionFields on AccountTransaction {
    address
    blockDatetime
    blockIndex
    blockchain
    confirmations {
      ...confirmationsFields
    }
    fiatValue
    status
    txid
    type
    value {
      ...currencyAmountFields
    }
  }
  ${CONFIRMATIONS_FRAGMENT}
  ${CURRENCY_AMOUNT_FRAGMENT}
`