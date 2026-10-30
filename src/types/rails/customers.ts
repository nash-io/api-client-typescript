import { RailsEnvironment } from './common'

export type RailsKycStatusValue =
  | 'tier_0'
  | 'submitted_age_location'
  | 'rejected'
  | 'approved_age_verification'
  | 'failed_location_verification'
  | 'approved_location_verification'
  | 'approved_sanction_screening'
  | 'uploaded_identity_verification'
  | 'failed_identity_verification'
  | 'verifying_identity_manually'
  | 'tier_1'

export type RailsKycFailureDetail =
  | 'none'
  | 'underage'
  | 'location_banned'
  | 'found_screening_results'
  | 'ip_address_and_address_mismatch'
  | 'ip_address_is_proxy'
  | 'ip_address_is_tor'
  | 'ip_address_is_dangerous'
  | 'ip_address_is_crawler'
  | 'unknown_error'
  | 'denied_fraud'
  | 'identity_verification_too_many_attempts'
  | 'birthdate_invalid_on_id'
  | 'blurred'
  | 'bad_quality'
  | 'missing_part_document'
  | 'hidden_part_document'
  | 'damaged_document'
  | 'photocopy_black_white'
  | 'photocopy_color'
  | 'digital_copy'
  | 'not_readable_document'
  | 'no_document'
  | 'sample_document'
  | 'missing_back'
  | 'wrong_document_page'
  | 'missing_signature'
  | 'camera_black_white'
  | 'different_persons_shown'
  | 'manual_rejection'
  | 'multiple_people'
  | 'no_face_present'
  | 'face_not_fully_visible'
  | 'black_and_white'
  | 'liveness_failed'
  | 'no_match'
  | 'duplicate_account'
  | 'invalid_nationality'
  | 'expired_document'
  | 'ip_resolve_failure'
  | 'invalid_document'
  | 'face_does_not_match_id'
  | 'failed_id_reading'
  | 'identity_validation_service_not_available'
  | 'missing_id_template'
  | 'banned_identity_match'

export type RailsKycRequirementFieldName =
  | 'first_name'
  | 'last_name'
  | 'birthdate'
  | 'country_of_birth'
  | 'city_of_birth'
  | 'tax_residency_country'
  | 'tax_id_number'
  | 'road_address'
  | 'city'
  | 'postal_code'
  | 'country_of_residence'

export type RailsAgreementType =
  | 'terms_and_conditions'
  | 'privacy_policy'

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
  type: 'string' | 'date'
  mandatory: boolean
}

export interface RailsKycRequirement {
  type: 'identity_verification'
  description: string
  required: boolean
  step: 'personal_information' | 'source_of_funds' | 'identity_verification' | 'complete'
  fields: RailsKycRequirementField[]
}

export type RailsKycRevalidationStatus =
  | 'pending_scanning'
  | 'pending_approval'
  | 'completed'
  | 'completed_id_expiring_soon'

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
