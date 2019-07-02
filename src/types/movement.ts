import { CryptoCurrency } from '../constants/currency';
import { CurrencyAmount, DateTime } from '../types';

export enum MovementType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  TRANSFER = 'TRANSFER'
}

export enum MovementStatus {
  CREATED = 'CREATED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PENDING = 'PENDING'
}

export interface Movement {
  address: string;
  confirmations: number;
  id: number;
  currency: CryptoCurrency;
  quantity: CurrencyAmount;
  receivedAt: DateTime;
  status: MovementStatus;
  publicKey: string;
  signature: string;
}

export interface SignMovementResult {
  result: Movement;
  blockchain_data: BlockchainData;
}

export interface BlockchainData {
  prefix:string;
  address: string;
  asset: string;
  amount: string;
  nonce: string;
  userpubkey: string;
  usersig: string;
}