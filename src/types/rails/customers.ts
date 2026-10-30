import { RailsEnvironment } from './common'

export interface RailsCustomerCreation {
  email: string
  countryCode: string
  offeringConsent?: boolean
  stateCode?: string
  [key: string]: unknown
}

export interface RailsCreatedCustomer {
  environment: RailsEnvironment
  id: string
  email: string
}

export interface RailsCustomerSummary {
  id: string
  emailMasked: string | null
  kycStatus: string | null
  createdAt: string
}

export interface RailsCustomerPage {
  environment: RailsEnvironment
  items: RailsCustomerSummary[]
  nextCursor: string | null
}

export interface RailsKycRequirementField {
  field: string
  type: string
  mandatory: boolean
}

export interface RailsKycRequirement {
  type: 'identity_verification'
  description: string
  required: boolean
  step: 'personal_information' | 'source_of_funds' | 'identity_verification' | 'complete'
  fields: RailsKycRequirementField[]
}

export interface RailsKycSnapshot {
  status: string
  requirements: RailsKycRequirement[]
  failureDetail: string | null
}

export interface RailsCustomer {
  environment: RailsEnvironment
  id: string
  kyc: RailsKycSnapshot
}

export interface RailsKycStatus {
  environment: RailsEnvironment
  status: string
  requirements: RailsKycRequirement[]
  failureDetail: string | null
}

export interface RailsKycInitiation {
  environment: RailsEnvironment
  status: string
  requirements: RailsKycRequirement[]
  failureDetail: string | null
  wizard?: {
    url: string
    caseId: string
    mediaToken: string
  } | null
}

export interface RailsListCustomersFilters {
  customer_id?: string
  cursor?: string
  limit?: number
}

export interface RailsPendingAgreement {
  id: string
  type: string
  version: string
  link: string
}

export interface RailsGetCustomerTermsResponse {
  environment: RailsEnvironment
  agreements: RailsPendingAgreement[]
}

export type RailsListCustomersResponse = RailsCustomerPage
export type RailsCreateCustomerRequest = RailsCustomerCreation
export type RailsCreateCustomerResponse = RailsCreatedCustomer
export type RailsGetCustomerResponse = RailsCustomer
export type RailsGetCustomerKycResponse = RailsKycStatus
export type RailsInitiateCustomerKycResponse = RailsKycInitiation
