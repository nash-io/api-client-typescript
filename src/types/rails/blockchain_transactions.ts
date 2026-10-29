import { RailsEnvironment } from './common'

export interface RailsMpcPayloadSignature {
  publicKey: string
  signedDigest: string
  [key: string]: unknown
}

export interface RailsMpcSignedPayloadRequest {
  payload: Record<string, unknown>
  signature: RailsMpcPayloadSignature
  [key: string]: unknown
}

export interface RailsDhPoolRequest {
  dhPublics: string[]
  blockchain: string
  [key: string]: unknown
}

export interface RailsDhPoolResponse {
  environment: RailsEnvironment
  dhFillPool: Array<unknown>
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
