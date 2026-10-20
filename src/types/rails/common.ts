export interface RailsRequestOptions {
  idempotencyKey?: string
  headers?: Record<string, string>
}

export type RailsEnvironment = 'sandbox' | 'production'
export type RailsOpenApiDocument = Record<string, unknown>

export interface RailsPartner {
  companyName?: string
  environment: RailsEnvironment
  id: string
  kybStatus: 'not_applied' | 'pending_kyc' | 'approved'
  scopes: string[]
}

export interface RailsCurrency {
  unit: string
  amount: string
  scale: number
}

/** Money inputs and outputs are exact strings; no JavaScript-number coercion. */
export type RailsMonetaryAmount = string

export type RailsGetPartnerResponse = RailsPartner
