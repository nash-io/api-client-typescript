import { CryptoCurrency } from '../constants/currency'
import { CurrencyAmount, DateTime } from '../types'

import {
  MovementTypeDeposit,
  MovementTypeWithdrawal,
  MovementTypeTransfer
} from '@neon-exchange/nash-protocol'

export type MovementType =
  | typeof MovementTypeDeposit
  | typeof MovementTypeWithdrawal
  | typeof MovementTypeTransfer

export enum MovementStatus {
  COMPLETED = 'COMPLETED',
  CREATED = 'CREATED',
  FAILED = 'FAILED',
  PENDING = 'PENDING'
}

export interface Movement {
  address: string
  confirmations: number
  id: string
  currency: CryptoCurrency
  quantity: CurrencyAmount
  receivedAt: DateTime
  status: MovementStatus
  transactionHash: string
  fee: string
  publicKey: string
  signature: string
  transactionElements?: []
  transactionPayload: string
  type: MovementType
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
