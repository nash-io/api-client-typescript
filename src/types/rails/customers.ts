import { RailsEnvironment } from './common'

export type RailsKycStatusValue =
  | 'TIER_0'
  | 'SUBMITTED_AGE_LOCATION'
  | 'REJECTED'
  | 'APPROVED_AGE_VERIFICATION'
  | 'FAILED_LOCATION_VERIFICATION'
  | 'APPROVED_LOCATION_VERIFICATION'
  | 'APPROVED_SANCTION_SCREENING'
  | 'UPLOADED_IDENTITY_VERIFICATION'
  | 'FAILED_IDENTITY_VERIFICATION'
  | 'VERIFYING_IDENTITY_MANUALLY'
  | 'TIER_1'
  | 'BLOCKED'

export type RailsKycFailureDetail =
  | 'NONE'
  | 'UNDERAGE'
  | 'LOCATION_BANNED'
  | 'FOUND_SCREENING_RESULTS'
  | 'IP_ADDRESS_AND_ADDRESS_MISMATCH'
  | 'IP_ADDRESS_IS_PROXY'
  | 'IP_ADDRESS_IS_TOR'
  | 'IP_ADDRESS_IS_DANGEROUS'
  | 'IP_ADDRESS_IS_CRAWLER'
  | 'UNKNOWN_ERROR'
  | 'DENIED_FRAUD'
  | 'IDENTITY_VERIFICATION_TOO_MANY_ATTEMPTS'
  | 'BIRTHDATE_INVALID_ON_ID'
  | 'BLURRED'
  | 'BAD_QUALITY'
  | 'MISSING_PART_DOCUMENT'
  | 'HIDDEN_PART_DOCUMENT'
  | 'DAMAGED_DOCUMENT'
  | 'PHOTOCOPY_BLACK_WHITE'
  | 'PHOTOCOPY_COLOR'
  | 'DIGITAL_COPY'
  | 'NOT_READABLE_DOCUMENT'
  | 'NO_DOCUMENT'
  | 'SAMPLE_DOCUMENT'
  | 'MISSING_BACK'
  | 'WRONG_DOCUMENT_PAGE'
  | 'MISSING_SIGNATURE'
  | 'CAMERA_BLACK_WHITE'
  | 'DIFFERENT_PERSONS_SHOWN'
  | 'MANUAL_REJECTION'
  | 'MULTIPLE_PEOPLE'
  | 'NO_FACE_PRESENT'
  | 'FACE_NOT_FULLY_VISIBLE'
  | 'BLACK_AND_WHITE'
  | 'LIVENESS_FAILED'
  | 'NO_MATCH'
  | 'DUPLICATE_ACCOUNT'
  | 'INVALID_NATIONALITY'
  | 'EXPIRED_DOCUMENT'
  | 'IP_RESOLVE_FAILURE'
  | 'INVALID_DOCUMENT'
  | 'FACE_DOES_NOT_MATCH_ID'
  | 'FAILED_ID_READING'
  | 'IDENTITY_VALIDATION_SERVICE_NOT_AVAILABLE'
  | 'MISSING_ID_TEMPLATE'
  | 'BANNED_IDENTITY_MATCH'

export type RailsKycRequirementFieldName =
  | 'FIRST_NAME'
  | 'LAST_NAME'
  | 'BIRTHDATE'
  | 'COUNTRY_OF_BIRTH'
  | 'CITY_OF_BIRTH'
  | 'TAX_RESIDENCY_COUNTRY'
  | 'TAX_ID_NUMBER'
  | 'ROAD_ADDRESS'
  | 'CITY'
  | 'POSTAL_CODE'
  | 'COUNTRY_OF_RESIDENCE'

export type RailsAgreementType =
  | 'TERMS_AND_CONDITIONS'
  | 'PRIVACY_POLICY'

export interface RailsCustomerCreation {
  email: string
  countryCode: string
  offeringConsent?: boolean
  stateCode?: string
}

export interface RailsCreatedCustomer {
  environment: RailsEnvironment
  id: string
  email: string
  existing: boolean
}

export interface RailsCustomerSummary {
  id: string
  emailMasked: string | null
  kycStatus: RailsKycStatusValue | null
  createdAt: string
}

export interface RailsCustomerPage {
  environment: RailsEnvironment
  items: RailsCustomerSummary[]
  nextCursor: string | null
}

export interface RailsKycRequirementField {
  field: RailsKycRequirementFieldName
  type: 'STRING' | 'DATE'
  mandatory: boolean
}

export interface RailsKycRequirement {
  type: 'IDENTITY_VERIFICATION'
  description: string
  required: boolean
  step: 'PERSONAL_INFORMATION' | 'SOURCE_OF_FUNDS' | 'IDENTITY_VERIFICATION' | 'COMPLETE'
  fields: RailsKycRequirementField[]
}

export type RailsKycRevalidationStatus =
  | 'PENDING_SCANNING'
  | 'PENDING_APPROVAL'
  | 'COMPLETED'
  | 'COMPLETED_ID_EXPIRING_SOON'

export interface RailsKycWizard {
  url: string
  caseId: string
  mediaToken: string
}

export interface RailsKycSnapshot {
  status: RailsKycStatusValue
  revalidationStatus: RailsKycRevalidationStatus
  requirements: RailsKycRequirement[]
  failureDetail: RailsKycFailureDetail | null
  wizard?: RailsKycWizard | null
}

export interface RailsCustomer {
  environment: RailsEnvironment
  id: string
  kyc: RailsKycSnapshot
}

export interface RailsKycStatus {
  environment: RailsEnvironment
  status: RailsKycStatusValue
  revalidationStatus: RailsKycRevalidationStatus
  requirements: RailsKycRequirement[]
  failureDetail: RailsKycFailureDetail | null
  wizard?: RailsKycWizard | null
}

export interface RailsKycInitiation {
  environment: RailsEnvironment
  status: RailsKycStatusValue
  revalidationStatus: RailsKycRevalidationStatus
  requirements: RailsKycRequirement[]
  failureDetail: RailsKycFailureDetail | null
  wizard?: RailsKycWizard | null
}

export interface RailsListCustomersFilters {
  customer_id?: string
  cursor?: string
  limit?: number
}

export interface RailsPendingAgreement {
  id: string
  type: RailsAgreementType
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
