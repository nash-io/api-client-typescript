import { RailsEnvironment } from './common'

export interface RailsMpcPayloadSignature {
  publicKey: string
  signedDigest: string
}

export interface RailsMpcSignedPayloadRequest {
  payload: Record<string, unknown>
  signature: RailsMpcPayloadSignature
}

export interface RailsDhPoolRequest {
  dhPublics: string[]
  blockchain: string
}

export interface RailsDhPoolResponse {
  environment: RailsEnvironment
  dhFillPool: Array<unknown>
}

export interface RailsBlockchainFees {
  blockchain: string
  index: number
  baseFeePerGas?: string | null
  maxFeePerGasHigh?: string | null
  maxFeePerGasLow?: string | null
  maxFeePerGasMedium?: string | null
  maxPriorityFeePerGasHigh?: string | null
  maxPriorityFeePerGasLow?: string | null
  maxPriorityFeePerGasMedium?: string | null
  priceHigh?: string | null
  priceLow?: string | null
  priceMedium?: string | null
}

export interface RailsGetBlockchainFeesResponse {
  environment: RailsEnvironment
  getBlockchainFees: RailsBlockchainFees
}

export interface RailsPrepareTransactionResponse {
  environment: RailsEnvironment
  prepareTransaction: Record<string, unknown>
}

export interface RailsIterateTransactionResponse {
  environment: RailsEnvironment
  iterateTransaction: Record<string, unknown>
}

export interface RailsCancelTransactionResponse {
  environment: RailsEnvironment
  cancelTransaction: string
}

export type RailsFillDhPoolRequest = RailsDhPoolRequest
export type RailsFillDhPoolResponse = RailsDhPoolResponse
export type RailsPrepareTransactionRequest = RailsMpcSignedPayloadRequest
export type RailsIterateTransactionRequest = RailsMpcSignedPayloadRequest
export type RailsCancelTransactionRequest = RailsMpcSignedPayloadRequest
