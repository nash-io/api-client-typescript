import { RailsEnvironment, RailsFiatQuantity } from './common'
import { RailsAgreementType, RailsKycStatusValue } from './customers'

export type RailsComplianceFieldName =
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
  | 'JOB_STATUS'
  | 'GROSS_ANNUAL_INCOME'
  | 'INDUSTRY'
  | 'OTHER_INDUSTRY'
  | 'JOB_TITLE'
  | 'IN_FULL_TIME_EDUCATION'
  | 'SOURCE_OF_INCOME'
  | 'INCOME_DETAILS'
  | 'INVESTMENT_TYPE'
  | 'DONOR_NAME'
  | 'GIFT_AMOUNT'
  | 'ACCOUNT_PURPOSES'
  | 'OTHER_ACCOUNT_PURPOSE'
  | 'FILE'
  | 'DESCRIPTION'
  | 'IBAN'
  | 'ANSWER'

export interface RailsComplianceRequirementField {
  field: RailsComplianceFieldName
  key: string
  mandatory: boolean
  options?: string[]
  type: 'STRING' | 'DATE' | 'ENUM' | 'CURRENCY' | 'BOOLEAN' | 'ENUM_LIST' | 'UPLOAD' | 'IBAN'
}

export type RailsComplianceObligationStatus =
  | 'MISSING'
  | 'EXPIRED'
  | 'REJECTED'
  | 'PENDING_UPLOAD'
  | 'PENDING_SCANNING'
  | 'PENDING_APPROVAL'

export type RailsComplianceRequestType =
  | 'PROOF_OF_ADDRESS'
  | 'PROOF_OF_FUNDS'
  | 'PROOF_OF_BANK_ACCOUNT_OWNERSHIP'
  | 'OTHER'

export interface RailsComplianceObligation {
  type:
    | 'ANNUAL_PERSONAL_INFORMATION'
    | 'SOURCE_OF_FUNDS'
    | 'DOCUMENT'
    | 'QUESTION'
    | 'IDENTITY_DOCUMENT_REVALIDATION'
    | 'PENDING_TERMS_ACCEPTANCE'
  blockFiatServices?: boolean
  confirmedAt?: string | null
  description?: string | null
  expiresAt?: string | null
  iban?: string | null
  id?: string
  question?: string | null
  requestType?: RailsComplianceRequestType
  requirements?: RailsComplianceRequirementField[]
  status?: RailsComplianceObligationStatus
  subject?: string | null
}

export interface RailsCompliancePendingReview {
  type: 'DOCUMENT' | 'QUESTION'
  id: string
  status: 'PENDING_REVIEW'
  blockFiatServices: boolean
  requestType?: RailsComplianceRequestType
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
}

export interface RailsAnswerComplianceResponse {
  environment: RailsEnvironment
  id: string
  answered: boolean
}

export interface RailsPersonalInformationRequest {
  firstName: string
  lastName: string
  /** A past date, `YYYY-MM-DD`. */
  birthdate: string
  countryOfBirth: string
  cityOfBirth: string
  taxResidencyCountry: string
  taxIdNumber: string
  address: {
    roadAddress: string
    city: string
    postalCode: string
    /** ISO 3166-1 alpha-2. */
    countryOfResidence: string
  }
}

export interface RailsPersonalInformationResponse {
  environment: RailsEnvironment
  id: string
  kycStatus: RailsKycStatusValue
}


export type RailsAccountPurpose =
  | 'INVESTMENT'
  | 'CRYPTO_EXCHANGE'
  | 'SAVING'
  | 'STAKING'
  | 'CASH_OUT_CRYPTO'
  | 'OTHER'

export type RailsIndustry =
  | 'SERVICES'
  | 'TRANSPORTATION'
  | 'HOSPITALITY'
  | 'RETAIL'
  | 'HEALTH_CARE'
  | 'FINANCE'
  | 'TECHNOLOGY'
  | 'MEDIA'
  | 'ENTERTAINMENT'
  | 'REAL_STATE'
  | 'PUBLIC_SECTOR'
  | 'OTHER'

export type RailsJobStatus =
  | 'EMPLOYED'
  | 'SELF_EMPLOYED'
  | 'UNEMPLOYED'
  | 'RETIRED'

export type RailsSourceOfIncome =
  | 'SALARY'
  | 'INVESTMENT'
  | 'GIFT_SCHOLARSHIP'
  | 'OTHER'

export interface RailsSourceOfFunds {
  accountPurposes?: RailsAccountPurpose[]
  annualIntendedVolume?: RailsFiatQuantity
  confirm?: boolean
  donorName?: string
  giftAmount?: RailsFiatQuantity
  grossAnnualIncome?: RailsFiatQuantity
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
}

export interface RailsAcceptedAgreement {
  id: string
  type: RailsAgreementType
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
