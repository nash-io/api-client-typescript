import { CryptoCurrency } from '../constants/currency'
import { CurrencyAmount, DateTime } from '../types'

export enum MovementType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL'
}

export enum MovementStatus {
  COMPLETED = 'COMPLETED',
  CREATED = 'CREATED',
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

export interface SignMovementResult {
  result: SignMovement
  blockchain_data: {
    address: string
    amount: string
    asset: string
    nonce: string
    prefix: string
    userPubKey: string
    userSig?: string
    r?: string
  }
}
