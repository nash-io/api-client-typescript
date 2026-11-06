import { RailsEnvironment } from './common'

export type RailsBlockchain =
  | 'ETH'
  | 'AVAXC'
  | 'POLYGON'
  | 'ARBITRUM'
  | 'NEO_X'
  | 'BNB'
  | 'BASE'
  | 'MANTLE'
  | 'OPTIMISM'
  | 'BTC'
  | 'SOLANA'
  | 'NEO3'

export type RailsAccountWalletBlockchain =
  | 'ETH'
  | 'AVAXC'
  | 'POLYGON'
  | 'ARBITRUM'
  | 'NEO_X'
  | 'BNB'
  | 'BASE'
  | 'MANTLE'
  | 'OPTIMISM'
  | 'NEO'
  | 'NEO3'
  | 'BTC'
  | 'SOLANA'

export type RailsPaymentMethodType =
  | 'EXTERNAL_BANK_ACCOUNT'
  | 'NASH_BANK_ACCOUNT'
  | 'CARD'

export type RailsPaymentMethodStatus =
  | 'PENDING_REVIEW'
  | 'REJECTED'
  | 'APPROVED'

export interface RailsBlockchains {
  environment: RailsEnvironment
  blockchains: RailsBlockchain[]
}

export interface RailsWalletChallengeRequest {
  blockchain: RailsBlockchain
  address: string
}

export interface RailsWalletChallengeResponse {
  environment: RailsEnvironment
  blockchain: RailsBlockchain
  address: string
  challenge: string
  expiresAt: string
}

export interface RailsWalletRegistrationRequest {
  blockchain: RailsBlockchain
  address: string
  signature: string
  challenge?: string
  publicKey?: string
  salt?: string
}

export interface RailsWallet {
  blockchain: RailsBlockchain
  address: string
  createdAt: string
}

export interface RailsRegisteredWallet {
  environment: RailsEnvironment
  wallet: RailsWallet
}

export interface RailsAccountWallet extends Omit<RailsWallet, 'blockchain'> {
  blockchain: RailsAccountWalletBlockchain
  type: 'NASH' | 'EXTERNAL'
}

export interface RailsAccountWalletsResponse {
  environment: RailsEnvironment
  wallets: RailsAccountWallet[]
}

export interface RailsIbanVerificationRequest {
  iban: string
}

export interface RailsPaymentMethod {
  id: string
  type: RailsPaymentMethodType | null
  last4: string | null
  currency: string | null
  nameVerified: boolean | null
  status: RailsPaymentMethodStatus | null
  payeeVerificationId: string | null
}

export type RailsIbanVerificationStatus =
  | 'APPROVED'
  | 'PENDING_REVIEW'
  | 'PROOF_OF_BANK_ACCOUNT_OWNERSHIP_REQUIRED'

export interface RailsIbanVerificationResponse {
  environment: RailsEnvironment
  status: RailsIbanVerificationStatus
  paymentMethod: RailsPaymentMethod
}

export interface RailsPaymentMethodSummary {
  id: string
  type: RailsPaymentMethodType | null
  status: RailsPaymentMethodStatus | null
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
  nextCursor: string | null
  paymentMethods: RailsPaymentMethodSummary[]
}
export type RailsListBlockchainsResponse = RailsBlockchains
export type RailsCreateWalletChallengeRequest = RailsWalletChallengeRequest
export type RailsCreateWalletChallengeResponse = RailsWalletChallengeResponse
export type RailsRegisterWalletRequest = RailsWalletRegistrationRequest
export type RailsRegisterWalletResponse = RailsRegisteredWallet
export type RailsListWalletsResponse = RailsAccountWalletsResponse
export type RailsVerifyBankAccountRequest = RailsIbanVerificationRequest
export type RailsVerifyBankAccountResponse = RailsIbanVerificationResponse
export type RailsListPaymentMethodsResponse = RailsPaymentMethodsResponse

export interface RailsListPaymentMethodsFilters {
  cursor?: string
  limit?: number
}
