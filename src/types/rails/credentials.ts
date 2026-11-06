import { RailsEnvironment } from './common'

export type RailsCredentialScope =
  | 'CUSTOMERS'
  | 'WALLETS_AND_BANK_ACCOUNTS'
  | 'FIAT_RAMP'
  | 'WEBHOOKS'
  | 'API_KEYS'
  | 'BLOCKCHAIN_TRANSACTIONS'

export interface RailsCredential {
  id: string
  name: string | null
  environment: RailsEnvironment | null
  scopes: RailsCredentialScope[]
  createdAt: string | null
  expiresAt: string | null
  lastUsedAt: string | null
}

export interface RailsCredentialListResponse {
  environment: RailsEnvironment
  credentials: RailsCredential[]
}

export interface RailsCredentialResponse {
  environment: RailsEnvironment
  credential: RailsCredential
}

export type RailsListApiKeysResponse = RailsCredentialListResponse
export type RailsGetApiKeyResponse = RailsCredentialResponse
export type RailsRevokeApiKeyResponse = RailsCredentialResponse
