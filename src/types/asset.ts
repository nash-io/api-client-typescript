import { Blockchain } from './common';
import { CryptoCurrency } from '../constants/currency';

export interface Asset {
  blockchain: Blockchain;
  blockchainPrecision: number;
  depositPrecision: number;
  hash: string;
  name: string;
  symbol: CryptoCurrency;
  withdrawalPrecision: number;
}

export interface AssetData {
  blockchain: Blockchain,
  precision: number,
  hash: string
}