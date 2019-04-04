import { CryptoCurrency } from '../constants/currency'
import { CurrencyAmount, DateTime } from '../types'

export enum MovementType {
    DEPOSIT = 'DEPOSIT',
    WITHDRAWAL = 'WITHDRAWAL'
}

export enum MovementStatus {
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    PENDING = 'PENDING'
}

export interface Movement {
    address: string
    confirmations: number
    id: number
    currency: CryptoCurrency
    quantity: CurrencyAmount
    receivedAt: DateTime
    status: MovementStatus
}

export interface SignMovement {
    movement: Movement
    publicKey: string
    signature: string
}