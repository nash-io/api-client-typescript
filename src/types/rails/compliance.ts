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


export interface RailsSourceOfFunds {
  account_purposes?: string[]
  annual_intended_volume?: RailsMonetaryAmount
  confirm?: boolean
  donor_name?: string
  gift_amount?: RailsMonetaryAmount
  gift_amount_local?: RailsMonetaryAmount
  gross_annual_income?: RailsMonetaryAmount
  gross_annual_income_local?: RailsMonetaryAmount
  in_full_time_education?: boolean
  income_details?: string
  industry?: string
  investment_type?: string
  job_status?: string
  job_title?: string
  offering_consent?: boolean
  other_account_purpose?: string
  other_industry?: string
  source_of_income?: string
  sourceOfFunds?: RailsSourceOfFunds
  [key: string]: unknown
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
