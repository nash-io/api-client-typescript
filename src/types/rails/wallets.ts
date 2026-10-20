import { RailsEnvironment } from './common'

export interface RailsBlockchains {
  environment: RailsEnvironment
  blockchains: string[]
}

export interface RailsWalletChallengeRequest {
  blockchain: string
  address: string
  [key: string]: unknown
}

export interface RailsWalletChallengeResponse {
  environment: RailsEnvironment
  blockchain: string
  address: string
  challenge: string
}

export interface RailsWalletRegistrationRequest {
  blockchain: string
  address: string
  signature: string
  challenge?: string
  publicKey?: string
  salt?: string
  [key: string]: unknown
}

export interface RailsWallet {
  blockchain: string
  address: string
  createdAt: string
}

export interface RailsRegisteredWallet {
  environment: RailsEnvironment
  wallet: RailsWallet
}

export interface RailsCustomerWalletsResponse {
  environment: RailsEnvironment
  wallets: RailsWallet[]
}

export interface RailsIbanVerificationRequest {
  iban: string
  [key: string]: unknown
}

export interface RailsPaymentMethod {
  id: string
  type: string | null
  iban: string | null
  currency: string | null
  nameVerified: boolean | null
  status: string | null
  payeeVerificationId: string | null
}

export type RailsIbanVerificationStatus =
  | 'approved'
  | 'pending_review'
  | 'proof_of_bank_account_ownership_required'

export interface RailsIbanVerificationResponse {
  environment: RailsEnvironment
  status: RailsIbanVerificationStatus
  paymentMethod: RailsPaymentMethod
}

export interface RailsPaymentMethodSummary {
  id: string
  type: string | null
  status: string | null
  currency: string | null
  description: string | null
  nameVerified: boolean | null
  rejectionReason: string | null
  last4: string | null
  cardScheme?: string | null
  expiryMonth?: number | null
  expiryYear?: number | null
}

export interface RailsPaymentMethodsResponse {
  environment: RailsEnvironment
  metadata?: Record<string, unknown> | null
  paymentMethods: RailsPaymentMethodSummary[]
}
export type RailsListBlockchainsResponse = RailsBlockchains
export type RailsCreateWalletChallengeRequest = RailsWalletChallengeRequest
export type RailsCreateWalletChallengeResponse = RailsWalletChallengeResponse
export type RailsRegisterWalletRequest = RailsWalletRegistrationRequest
export type RailsRegisterWalletResponse = RailsRegisteredWallet
export type RailsListCustomerWalletsResponse = RailsCustomerWalletsResponse
export type RailsVerifyBankAccountRequest = RailsIbanVerificationRequest
export type RailsVerifyBankAccountResponse = RailsIbanVerificationResponse
export type RailsListPaymentMethodsResponse = RailsPaymentMethodsResponse
