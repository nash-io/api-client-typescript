import { RailsEnvironment } from './common'

export type RailsCredentialScope =
  | 'customers'
  | 'wallets_and_bank_accounts'
  | 'fiat_ramp'
  | 'webhooks'
  | 'api_keys'
  | 'blockchain_transactions'

export interface RailsCredential {
  id: string
  name: string | null
  environment: RailsEnvironment | null
  scopes: RailsCredentialScope[]
  insertedAt: string | null
  expireAt: string | null
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
