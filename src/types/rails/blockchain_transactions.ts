import { RailsCryptoQuantityInput, RailsEnvironment } from './common'
import { RailsBlockchain } from './wallets'

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
  blockchain: RailsBlockchain
}

export interface RailsDhPoolResponse {
  environment: RailsEnvironment
  serverPublics: string[]
}

export interface RailsBlockchainFees {
  blockchain: RailsBlockchain
  index: number
  baseFeePerGas?: string | null
  maxFeePerGasHigh?: string | null
  maxFeePerGasLow?: string | null
  maxFeePerGasMedium?: string | null
  maxPriorityFeePerGasHigh?: string | null
  maxPriorityFeePerGasLow?: string | null
  maxPriorityFeePerGasMedium?: string | null
  priceHigh: string
  priceLow: string
  priceMedium: string
}

export interface RailsGetBlockchainFeesResponse {
  environment: RailsEnvironment
  blockchainFees: RailsBlockchainFees
}

export interface RailsTransactionElement {
  blockchain: RailsBlockchain
  elementType: string
  payload: string
  payloadHash: string
  payloadHashFunction: string
  signatureFunction: string
}

export interface RailsPrepareTransactionResponse {
  environment: RailsEnvironment
  preparedTransaction: {
    reference: string
    transaction: {
      transactionFee: RailsCryptoQuantityInput
      transactionNonce?: number | null
      transactionSpecific?: Record<string, unknown>
    }
    transactionElements: RailsTransactionElement[]
  }
}

export interface RailsIterateTransactionResponse {
  environment: RailsEnvironment
  iteratedTransaction: {
    transactionElements: RailsTransactionElement[]
    transactionHash?: string | null
  }
}

export interface RailsCancelTransactionResponse {
  environment: RailsEnvironment
  cancelled: boolean
}

export type RailsFillDhPoolRequest = RailsDhPoolRequest
export type RailsFillDhPoolResponse = RailsDhPoolResponse
export type RailsPrepareTransactionRequest = RailsMpcSignedPayloadRequest
export type RailsIterateTransactionRequest = RailsMpcSignedPayloadRequest
export type RailsCancelTransactionRequest = RailsMpcSignedPayloadRequest
