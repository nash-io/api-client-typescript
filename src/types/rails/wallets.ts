import { RailsEnvironment } from './common'

export type RailsBlockchain =
  | 'eth'
  | 'avaxc'
  | 'polygon'
  | 'arbitrum'
  | 'neo_x'
  | 'bnb'
  | 'base'
  | 'mantle'
  | 'optimism'
  | 'btc'
  | 'solana'
  | 'neo3'

export type RailsAccountWalletBlockchain =
  | 'eth'
  | 'avaxc'
  | 'polygon'
  | 'arbitrum'
  | 'neo_x'
  | 'bnb'
  | 'base'
  | 'mantle'
  | 'optimism'
  | 'neo'
  | 'neo3'
  | 'btc'
  | 'solana'

export type RailsPaymentMethodType =
  | 'external_bank_account'
  | 'nash_bank_account'
  | 'card'

export type RailsPaymentMethodStatus =
  | 'pending_review'
  | 'rejected'
  | 'approved'

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
  type: 'nash' | 'external'
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
  iban: string | null
  currency: string | null
  nameVerified: boolean | null
  status: RailsPaymentMethodStatus | null
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
  metadata?: Record<string, unknown> | null
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
