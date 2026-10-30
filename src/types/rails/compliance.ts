import { RailsEnvironment, RailsMonetaryAmount } from './common'

export interface RailsComplianceObligation {
  type:
    | 'annual_personal_information'
    | 'source_of_funds'
    | 'document'
    | 'question'
    | 'identity_document_revalidation'
    | 'pending_terms_acceptance'
  blockFiatServices?: boolean
  confirmedAt?: string | null
  description?: string | null
  expiresAt?: string | null
  iban?: string | null
  id?: string
  question?: string | null
  requestType?: string
  requirements?: Array<Record<string, unknown>>
  status?: string
  subject?: string | null
}

export interface RailsCompliancePendingReview {
  type: 'document' | 'question'
  id: string
  status: 'pending_review'
  blockFiatServices: boolean
  requestType?: 'proof_of_address' | 'proof_of_funds' | 'proof_of_bank_account_ownership' | 'other'
  question?: string | null
  subject?: string | null
}

export interface RailsComplianceRequirements {
  environment: RailsEnvironment
  requirements: RailsComplianceObligation[]
  pendingReviews: RailsCompliancePendingReview[]
}

export interface RailsAnswerComplianceRequest {
  answer: string
  [key: string]: unknown
}

export interface RailsAnswerComplianceResponse {
  environment: RailsEnvironment
  id: string
  answered: boolean
}

export interface RailsPersonalInformationRequest {
  taxResidencyAndCountryOfResidenceMatch?: boolean
  [key: string]: unknown
}

export interface RailsPersonalInformationResponse {
  environment: RailsEnvironment
  id: string
  kycStatus: string
}


export type RailsAccountPurpose =
  | 'investment'
  | 'crypto_exchange'
  | 'saving'
  | 'staking'
  | 'cash_out_crypto'
  | 'other'

export type RailsIndustry =
  | 'services'
  | 'transportation'
  | 'hospitality'
  | 'retail'
  | 'health_care'
  | 'finance'
  | 'technology'
  | 'media'
  | 'entertainment'
  | 'real_state'
  | 'public_sector'
  | 'other'

export type RailsJobStatus =
  | 'employed'
  | 'self_employed'
  | 'unemployed'
  | 'retired'

export type RailsSourceOfIncome =
  | 'salary'
  | 'investment'
  | 'gift_scholarship'
  | 'other'

export interface RailsSourceOfFunds {
  accountPurposes?: RailsAccountPurpose[]
  annualIntendedVolume?: RailsMonetaryAmount
  confirm?: boolean
  donorName?: string
  giftAmount?: RailsMonetaryAmount
  grossAnnualIncome?: RailsMonetaryAmount
  inFullTimeEducation?: boolean
  incomeDetails?: string
  industry?: RailsIndustry
  investmentType?: string
  jobStatus?: RailsJobStatus
  jobTitle?: string
  offeringConsent?: boolean
  otherAccountPurpose?: string
  otherIndustry?: string
  sourceOfIncome?: RailsSourceOfIncome
  sourceOfFunds?: RailsSourceOfFunds
}

export type RailsSubmitSourceOfFundsRequest = RailsSourceOfFunds

export interface RailsSubmitSourceOfFundsResponse {
  environment: RailsEnvironment
  id: string
}

export interface RailsTermsAcceptanceRequest {
  agreements:
    | string[]
    | Array<{ id: string; version?: string }>
    | Record<string, string>
  [key: string]: unknown
}

export interface RailsAcceptedAgreement {
  id: string
  type: string
  version: string
}

export interface RailsTermsAcceptanceResponse {
  environment: RailsEnvironment
  acceptedAt: string
  partnerCredentialRef: string
  agreements: RailsAcceptedAgreement[]
}

export interface RailsDocument {
  data: Buffer
  filename: string
  contentType?: string
}

export type RailsSubmitComplianceDocumentsRequest = RailsDocument[]

export interface RailsSubmittedDocument {
  id: string
}

export interface RailsSubmitComplianceDocumentsResponse {
  environment: RailsEnvironment
  documents: RailsSubmittedDocument[]
}

export type RailsAcceptCustomerTermsRequest = RailsTermsAcceptanceRequest
export type RailsAcceptCustomerTermsResponse = RailsTermsAcceptanceResponse
export type RailsGetComplianceRequirementsResponse = RailsComplianceRequirements
export type RailsConfirmPersonalInformationRequest = RailsPersonalInformationRequest
export type RailsConfirmPersonalInformationResponse = RailsPersonalInformationResponse
