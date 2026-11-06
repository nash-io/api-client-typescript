import type { RailsCredentialScope } from './credentials'

export interface RailsRequestOptions {
  idempotencyKey?: string
  headers?: Record<string, string>
}

export type RailsEnvironment = 'SANDBOX' | 'PRODUCTION'
export type RailsOpenApiDocument = Record<string, unknown>

export interface RailsFiatQuantity {
  /** Decimal string. */
  amount: string
  /** Lowercase fiat currency symbol, e.g. `eur`. */
  currency: string
}

export interface RailsCryptoQuantityInput {
  /** Decimal string. */
  amount: string
  /** Lowercase hex asset id from `getAssetRates`. */
  assetHash: string
  blockchain: string
}

export interface RailsCryptoQuantity extends RailsCryptoQuantityInput {
  blockchainPrecision: number
  symbol: string
}

export interface RailsRate {
  amount: string
  currencyA: string
  currencyB: string
}

export interface RailsPartner {
  companyName?: string
  environment: RailsEnvironment
  id: string
  kybStatus: 'NOT_APPLIED' | 'PENDING_KYC' | 'APPROVED'
  limits: {
    monthlyRequests: number
    requestsPerMinute: number
    tier: 'STARTER' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'
  }
  scopes: RailsCredentialScope[]
  usage: {
    month: string
    requests: number
    fiatRamp: {
      buyVolume: RailsFiatQuantity
      completedOrders: number
      sellVolume: RailsFiatQuantity
      totalVolume: RailsFiatQuantity
    }
  }
}

export type RailsGetPartnerResponse = RailsPartner
