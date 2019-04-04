import { CryptoCurrency } from '../constants/currency'
import { PaginationCursor, CurrencyAmount } from '../types'

export enum TransactionStatus {
    PENDING = 'pending',
    COMPLETED = 'completed'
}

export enum TransactionType {
    DEPOSIT = 'deposit',
    WITHDRAWAL = 'withdrawal'
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

export interface Confirmations {
    numerator: number
    denominator: number
}

export interface AccountTransactionResponse {
    nextCursor: PaginationCursor,
    transactions: AccountTransaction[]
} 