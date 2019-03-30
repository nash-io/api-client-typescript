import { DateTime } from '../../../types'
import { CurrencyAmount, } from '../../currency/fragments'
import { CryptoCurrency } from '../../../constants/currency'

export interface Movement {
    address: string
    confirmations: number
    currency: CryptoCurrency
    id: number
    quantity: CurrencyAmount
    receivedAt: DateTime
    status: MovementStatus
    type: MovementType
}

export enum MovementStatus {
    COMPLETED = 'completed',
    FAILED = 'failed',
    PENDING = 'pending'
}

export enum MovementType {
    DEPOSIT = 'deposit',
    WITHDRAWAL = 'withdrawal'
}