export interface RailsRequestOptions {
  idempotencyKey?: string
  headers?: Record<string, string>
}

export type RailsEnvironment = 'sandbox' | 'production'
export type RailsOpenApiDocument = Record<string, unknown>

export interface RailsPartner {
  companyName?: string
  environment: RailsEnvironment
  id: string
  kybStatus: 'not_applied' | 'pending_kyc' | 'approved'
  scopes: string[]
}

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
  step: 'face_scan' | 'document_scan' | 'complete'
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
}

export interface RailsComplianceObligation {
  type: 'annual_personal_information' | 'source_of_funds' | 'document' | 'question'
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

export interface RailsComplianceRequirements {
  environment: RailsEnvironment
  requirements: RailsComplianceObligation[]
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

export interface RailsCurrency {
  unit: string
  amount: string
  scale: number
}

/** Money inputs and outputs are exact strings; no JavaScript-number coercion. */
export type RailsMonetaryAmount = string

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

export interface RailsBankDepositInstructions {
  recipientName: string | null
  iban: string | null
  bic: string | null
  accountNumber: string | null
  sortCode: string | null
  referenceCode: string | null
  recipientBankCountry: string | null
  recipientAddress: {
    line1?: string | null
    line2?: string | null
    line3?: string | null
  } | null
}

export interface RailsCryptoDepositInstructions {
  destinationAddress: string | null
}

export interface RailsQuote {
  id: string
  type: 'buy' | 'sell'
  status: string
  blockchain: string
  settlementType: string
  settlementAddress: string | null
  fiatAsset: string | null
  fiatAmount: string | null
  cryptoAmount: string | null
  confirmUntil: string | null
  reconfirmUntil: string | null
  transferUntil: string | null
  bankDepositInstructions: RailsBankDepositInstructions | null
  cryptoDepositInstructions: RailsCryptoDepositInstructions | null
}

export interface RailsQuoteRequest {
  type: 'buy' | 'sell'
  blockchain: string
  cryptoAsset: string
  fiatAsset: string
  capQuantityToMaximum?: boolean
  cryptoAmount?: RailsMonetaryAmount
  fiatAmount?: RailsMonetaryAmount
  gasLevel?: 'price_low' | 'price_medium' | 'price_high'
  metaData?: Record<string, unknown>
  settlementType?: 'personal_wallet'
  uniqueKey?: string
  [key: string]: unknown
}

export interface RailsQuoteResponse {
  environment: RailsEnvironment
  quote: RailsQuote
}

export interface RailsQuoteEstimationResponse {
  environment: RailsEnvironment
  side: 'buy' | 'sell'
  fixedValue: 'base' | 'target'
  base: RailsCurrency | null
  target: RailsCurrency | null
  targetAfterSettlement: RailsCurrency | null
  settlementNetworkFee: RailsCurrency | null
  rateAmount: string | null
}

export interface RailsHistoryOrder {
  id: string
  status: string
  inserted_at: string
}

export interface RailsQuoteHistoryResponse {
  environment: RailsEnvironment
  quotes: Array<RailsQuote | RailsHistoryOrder>
  cursor: string | null
}

export interface RailsQuoteConfirmationRequest {
  settlementAddress: string
  paymentMethodId?: string
  signatureForPermitTransfer?: string
  sourceOfFunds?: Record<string, unknown>
  userPlatform?: 'browser' | 'android' | 'ios'
  [key: string]: unknown
}

export interface RailsInstantBuyConfirmationResponse {
  environment: RailsEnvironment
  quote?: RailsQuote
}

export interface RailsOrder {
  id: string
  status: string
  createdAt: string
  blockchain?: string
  completedAt?: string
  cryptoAmount?: string
  fiatAmount?: string
  settlementAddress?: string
  type?: string
}

export interface RailsOrderPage {
  environment: RailsEnvironment
  orders: RailsOrder[]
  nextCursor: string | null
}

export interface RailsWebhookSubscriptionCreationRequest {
  url: string
  events: RailsWebhookEvent[]
  secret?: string
  [key: string]: unknown
}

export type RailsWebhookEvent =
  | 'compliance.request'
  | 'iban.verified'
  | 'kyc.updated'
  | 'order.created'
  | 'order.status_changed'
  | 'quote.created'
  | 'quote.expired'
  | 'quote.updated'
  | 'wallet.verified'

export interface RailsWebhookSubscription {
  id: string
  url: string
  events: string[]
  environment: RailsEnvironment
  active: boolean
  cancelled_at?: string
  inserted_at?: string
  updated_at?: string
}

export interface RailsIssuedWebhookSubscriptionResponse {
  environment: RailsEnvironment
  subscription: RailsWebhookSubscription
  signingSecret: string
}

export interface RailsWebhookSubscriptionsResponse {
  environment: RailsEnvironment
  subscriptions: RailsWebhookSubscription[]
}

export interface RailsWebhookSubscriptionResponse {
  environment: RailsEnvironment
  subscription: RailsWebhookSubscription
}

export interface RailsWebhookDeliveryAttempt {
  attempt: number
  outcome: string
  attempted_at: string
  duration_ms?: number
  error?: string
  response_status?: number
}

export type RailsWebhookDeliveryStatus = 'pending' | 'delivered' | 'failed' | 'skipped'

export interface RailsWebhookDelivery {
  id: string
  subscription_id: string
  sequence: number
  event_id: string
  event_type: string
  environment: RailsEnvironment
  status: RailsWebhookDeliveryStatus
  attempts_count: number
  attempts: RailsWebhookDeliveryAttempt[]
  delivered_at?: string
  last_attempted_at?: string
  last_error?: string
  last_response_status?: number
}

export interface RailsWebhookDeliveriesResponse {
  environment: RailsEnvironment
  deliveries: RailsWebhookDelivery[]
}

export interface RailsWebhookDeliveryPage {
  environment: RailsEnvironment
  deliveries: RailsWebhookDelivery[]
  nextCursor: string | null
}

export type RailsCredentialScope =
  | 'customers'
  | 'verification'
  | 'fiat_ramp'
  | 'webhooks'
  | 'api_keys'

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

export interface RailsMpcPayloadSignature {
  publicKey: string
  signedDigest: string
  [key: string]: unknown
}

export interface RailsMpcSignedPayloadRequest {
  payload: Record<string, unknown>
  signature: RailsMpcPayloadSignature
  [key: string]: unknown
}

export interface RailsDhPoolRequest {
  dhPublics: string[]
  blockchain: string
  [key: string]: unknown
}

export interface RailsDhPoolResponse {
  environment: RailsEnvironment
  dhFillPool: Array<unknown>
}

export type RailsCompletePayloadSignatureRequest = Record<string, unknown>
export type RailsCompleteBtcPayloadSignatureRequest = Record<string, unknown>

export interface RailsCompletePayloadSignatureResponse {
  environment: RailsEnvironment
  completePayloadSignature: Record<string, unknown>
}

export interface RailsCompleteBtcPayloadSignatureResponse {
  environment: RailsEnvironment
  completeBtcPayloadSignature: Array<unknown>
}

export interface RailsSendRawTransactionResponse {
  environment: RailsEnvironment
  sendBlockchainRawTransaction: string
}

export interface RailsPrepareTransactionResponse {
  environment: RailsEnvironment
  prepareTransaction: Record<string, unknown>
}

export interface RailsIterateTransactionResponse {
  environment: RailsEnvironment
  iterateTransaction: Record<string, unknown>
}

export interface RailsCancelTransactionResponse {
  environment: RailsEnvironment
  cancelTransaction: string
}

export interface RailsListCustomersFilters {
  customer_id?: string
  cursor?: string
  limit?: number
}

export interface RailsListQuotesFilters {
  cursor?: string
  limit?: number
}

export interface RailsListOrdersFilters {
  customer_id?: string
  cursor?: string
  limit?: number
}

export interface RailsListWebhookDeliveriesFilters {
  subscription_id?: string
  cursor?: string
  limit?: number
}

export type RailsGetPartnerResponse = RailsPartner
export type RailsListCustomersResponse = RailsCustomerPage
export type RailsCreateCustomerRequest = RailsCustomerCreation
export type RailsCreateCustomerResponse = RailsCreatedCustomer
export type RailsGetCustomerResponse = RailsCustomer
export type RailsGetCustomerKycResponse = RailsKycStatus
export type RailsInitiateCustomerKycResponse = RailsKycInitiation
export type RailsAcceptCustomerTermsRequest = RailsTermsAcceptanceRequest
export type RailsAcceptCustomerTermsResponse = RailsTermsAcceptanceResponse
export type RailsGetComplianceRequirementsResponse = RailsComplianceRequirements
export type RailsConfirmPersonalInformationRequest = RailsPersonalInformationRequest
export type RailsConfirmPersonalInformationResponse = RailsPersonalInformationResponse
export type RailsListBlockchainsResponse = RailsBlockchains
export type RailsCreateWalletChallengeRequest = RailsWalletChallengeRequest
export type RailsCreateWalletChallengeResponse = RailsWalletChallengeResponse
export type RailsRegisterWalletRequest = RailsWalletRegistrationRequest
export type RailsRegisterWalletResponse = RailsRegisteredWallet
export type RailsListCustomerWalletsResponse = RailsCustomerWalletsResponse
export type RailsVerifyBankAccountRequest = RailsIbanVerificationRequest
export type RailsVerifyBankAccountResponse = RailsIbanVerificationResponse
export type RailsListPaymentMethodsResponse = RailsPaymentMethodsResponse
export type RailsListQuotesResponse = RailsQuoteHistoryResponse
export type RailsCreateQuoteRequest = RailsQuoteRequest
export type RailsCreateQuoteResponse = RailsQuoteResponse
export type RailsDryQuoteRequest = RailsQuoteRequest
export type RailsDryQuoteResponse = RailsQuoteEstimationResponse
export type RailsGetQuoteResponse = RailsQuoteResponse
export type RailsCancelQuoteResponse = RailsQuoteResponse
export type RailsConfirmBuyRequest = RailsQuoteConfirmationRequest
export type RailsConfirmBuyResponse = RailsQuoteResponse
export type RailsConfirmInstantBuyRequest = RailsQuoteConfirmationRequest
export type RailsConfirmInstantBuyResponse = RailsInstantBuyConfirmationResponse
export type RailsConfirmSellRequest = RailsQuoteConfirmationRequest
export type RailsConfirmSellResponse = RailsQuoteResponse
export type RailsRecalculateQuoteResponse = RailsQuoteResponse
export type RailsReconfirmQuoteResponse = RailsQuoteResponse
export type RailsListOrdersResponse = RailsOrderPage
export type RailsListWebhookSubscriptionsResponse = RailsWebhookSubscriptionsResponse
export type RailsCreateWebhookSubscriptionRequest = RailsWebhookSubscriptionCreationRequest
export type RailsCreateWebhookSubscriptionResponse = RailsIssuedWebhookSubscriptionResponse
export type RailsCancelWebhookSubscriptionResponse = RailsWebhookSubscriptionResponse
export type RailsRotateWebhookSubscriptionResponse = RailsIssuedWebhookSubscriptionResponse
export type RailsListSubscriptionDeliveriesResponse = RailsWebhookDeliveriesResponse
export type RailsListWebhookDeliveriesResponse = RailsWebhookDeliveryPage
export type RailsListApiKeysResponse = RailsCredentialListResponse
export type RailsGetApiKeyResponse = RailsCredentialResponse
export type RailsRevokeApiKeyResponse = RailsCredentialResponse
export type RailsFillDhPoolRequest = RailsDhPoolRequest
export type RailsFillDhPoolResponse = RailsDhPoolResponse
export type RailsSendRawTransactionRequest = RailsMpcSignedPayloadRequest
export type RailsPrepareTransactionRequest = RailsMpcSignedPayloadRequest
export type RailsIterateTransactionRequest = RailsMpcSignedPayloadRequest
export type RailsCancelTransactionRequest = RailsMpcSignedPayloadRequest
