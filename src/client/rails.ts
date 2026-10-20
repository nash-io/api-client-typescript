import AbortController from 'abort-controller'
import { createHash, randomBytes } from 'crypto'
import FormData from 'form-data'
import fetch from 'node-fetch'
import { authenticatedHeaders, RequestCredentials } from './requestSigning'
import { RailsApiError } from './railsError'
import { EnvironmentConfig } from './environments'
import {
  RailsAcceptCustomerTermsRequest,
  RailsAcceptCustomerTermsResponse,
  RailsAnswerComplianceRequest,
  RailsAnswerComplianceResponse,
  RailsCancelQuoteResponse,
  RailsCancelTransactionRequest,
  RailsCancelWebhookSubscriptionResponse,
  RailsCompleteBtcPayloadSignatureRequest,
  RailsCompleteBtcPayloadSignatureResponse,
  RailsCompletePayloadSignatureRequest,
  RailsCompletePayloadSignatureResponse,
  RailsConfirmBuyRequest,
  RailsConfirmBuyResponse,
  RailsConfirmInstantBuyRequest,
  RailsConfirmInstantBuyResponse,
  RailsConfirmSellRequest,
  RailsConfirmSellResponse,
  RailsConfirmPersonalInformationRequest,
  RailsConfirmPersonalInformationResponse,
  RailsCreateCustomerRequest,
  RailsCreateCustomerResponse,
  RailsCreateQuoteRequest,
  RailsCreateQuoteResponse,
  RailsCreateWalletChallengeRequest,
  RailsCreateWalletChallengeResponse,
  RailsCreateWebhookSubscriptionRequest,
  RailsCreateWebhookSubscriptionResponse,
  RailsDryQuoteRequest,
  RailsDryQuoteResponse,
  RailsFillDhPoolRequest,
  RailsFillDhPoolResponse,
  RailsGetApiKeyResponse,
  RailsGetComplianceRequirementsResponse,
  RailsGetCustomerKycResponse,
  RailsGetCustomerResponse,
  RailsGetPartnerResponse,
  RailsGetQuoteResponse,
  RailsInitiateCustomerKycResponse,
  RailsIterateTransactionRequest,
  RailsIterateTransactionResponse,
  RailsListApiKeysResponse,
  RailsListBlockchainsResponse,
  RailsListCustomerWalletsResponse,
  RailsListCustomersFilters,
  RailsListCustomersResponse,
  RailsListOrdersFilters,
  RailsListOrdersResponse,
  RailsListPaymentMethodsResponse,
  RailsListQuotesFilters,
  RailsListQuotesResponse,
  RailsListSubscriptionDeliveriesResponse,
  RailsListWebhookDeliveriesFilters,
  RailsListWebhookDeliveriesResponse,
  RailsListWebhookSubscriptionsResponse,
  RailsOpenApiDocument,
  RailsPrepareTransactionRequest,
  RailsPrepareTransactionResponse,
  RailsRecalculateQuoteResponse,
  RailsReconfirmQuoteResponse,
  RailsRegisterWalletRequest,
  RailsRegisterWalletResponse,
  RailsRequestOptions,
  RailsRevokeApiKeyResponse,
  RailsRotateWebhookSubscriptionResponse,
  RailsSendRawTransactionRequest,
  RailsSendRawTransactionResponse,
  RailsSubmitComplianceDocumentsRequest,
  RailsSubmitComplianceDocumentsResponse,
  RailsCancelTransactionResponse,
  RailsSubmitSourceOfFundsRequest,
  RailsSubmitSourceOfFundsResponse,
  RailsVerifyBankAccountRequest,
  RailsVerifyBankAccountResponse
} from '../types/rails'
export { RailsApiError }

type MultipartFormData = FormData & {
  setBoundary(boundary: string): void
}

interface RailsRoute {
  method: 'GET' | 'POST' | 'DELETE'
  path: string
  public?: boolean
}

const RAILS_ROUTES = {
  getOpenApi: { method: 'GET', path: '/openapi.json', public: true },
  getPartner: { method: 'GET', path: '/partner' },
  listCustomers: { method: 'GET', path: '/customers' },
  createCustomer: { method: 'POST', path: '/customers' },
  getCustomer: { method: 'GET', path: '/customers/{customer_id}' },
  getCustomerKyc: { method: 'GET', path: '/customers/{customer_id}/kyc' },
  initiateCustomerKyc: {
    method: 'POST',
    path: '/customers/{customer_id}/kyc/initiate'
  },
  acceptCustomerTerms: { method: 'POST', path: '/customers/{customer_id}/terms' },
  getComplianceRequirements: {
    method: 'GET',
    path: '/customers/{customer_id}/compliance/requirements'
  },
  confirmPersonalInformation: {
    method: 'POST',
    path: '/customers/{customer_id}/compliance/personal-information'
  },
  submitSourceOfFunds: {
    method: 'POST',
    path: '/customers/{customer_id}/compliance/source-of-funds'
  },
  answerComplianceRequest: {
    method: 'POST',
    path: '/customers/{customer_id}/compliance/requests/{request_id}/answer'
  },
  submitComplianceDocuments: {
    method: 'POST',
    path: '/customers/{customer_id}/compliance/requests/{request_id}/documents'
  },
  listBlockchains: { method: 'GET', path: '/blockchains' },
  createWalletChallenge: { method: 'POST', path: '/wallets/challenge' },
  registerWallet: { method: 'POST', path: '/wallets' },
  listCustomerWallets: { method: 'GET', path: '/customers/{customer_id}/wallets' },
  verifyBankAccount: { method: 'POST', path: '/bank-accounts' },
  listPaymentMethods: { method: 'GET', path: '/payment-methods' },
  listQuotes: { method: 'GET', path: '/quotes' },
  createQuote: { method: 'POST', path: '/quotes' },
  createDryQuote: { method: 'POST', path: '/quotes/dry-quote' },
  getQuote: { method: 'GET', path: '/quotes/{quote_id}' },
  cancelQuote: { method: 'POST', path: '/quotes/{quote_id}/cancel' },
  confirmBuy: { method: 'POST', path: '/quotes/{quote_id}/confirm-buy' },
  confirmInstantBuy: {
    method: 'POST',
    path: '/quotes/{quote_id}/confirm-instant-buy'
  },
  confirmSell: { method: 'POST', path: '/quotes/{quote_id}/confirm-sell' },
  recalculateQuote: { method: 'POST', path: '/quotes/{quote_id}/recalculate' },
  reconfirmQuote: { method: 'POST', path: '/quotes/{quote_id}/reconfirm' },
  listOrders: { method: 'GET', path: '/orders' },
  listWebhookSubscriptions: { method: 'GET', path: '/webhooks/subscriptions' },
  createWebhookSubscription: {
    method: 'POST',
    path: '/webhooks/subscriptions'
  },
  cancelWebhookSubscription: {
    method: 'DELETE',
    path: '/webhooks/subscriptions/{subscription_id}'
  },
  rotateWebhookSecret: {
    method: 'POST',
    path: '/webhooks/subscriptions/{subscription_id}/rotate'
  },
  listSubscriptionDeliveries: {
    method: 'GET',
    path: '/webhooks/subscriptions/{subscription_id}/deliveries'
  },
  listWebhookDeliveries: { method: 'GET', path: '/webhooks/deliveries' },
  listApiKeys: { method: 'GET', path: '/api-keys' },
  getApiKey: { method: 'GET', path: '/api-keys/{api_key_id}' },
  revokeApiKey: { method: 'DELETE', path: '/api-keys/{api_key_id}' },
  fillDhPool: { method: 'POST', path: '/signing/dh-pool' },
  completePayloadSignature: {
    method: 'POST',
    path: '/signing/payload-signatures'
  },
  completeBtcPayloadSignature: {
    method: 'POST',
    path: '/signing/btc-payload-signatures'
  },
  sendRawTransaction: { method: 'POST', path: '/signing/raw-transactions' },
  prepareTransaction: { method: 'POST', path: '/signing/transactions/prepare' },
  iterateTransaction: { method: 'POST', path: '/signing/transactions/iterate' },
  cancelTransaction: { method: 'POST', path: '/signing/transactions/cancel' }
} as const

type RailsOperationName = keyof typeof RAILS_ROUTES

interface DispatchOptions {
  segments?: Record<string, string>
  query?: object
  customerId?: string
  body?: unknown
  rawBody?: Buffer
  contentType?: string
  contentDigest?: string
  options?: RailsRequestOptions
}

const RESERVED_HEADERS: Record<string, true> = {
  authorization: true,
  cookie: true,
  cookie2: true,
  'nash-timestamp': true,
  'nash-signature': true,
  'nash-customer-id': true,
  'nash-content-sha256': true,
  'x-api-key': true,
  'api-key': true,
  'proxy-authorization': true,
  'set-cookie': true
}

const SENSITIVE_ERROR_FIELDS: Record<string, true> = {
  authorization: true,
  body: true,
  content: true,
  document: true,
  file: true,
  secret: true,
  signature: true,
  token: true,
  apikey: true,
  requestsigningkey: true
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function sanitizeErrorDetails(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(item => sanitizeErrorDetails(item))
  }
  if (!isRecord(value)) {
    return value
  }

  const details: Record<string, unknown> = {}
  Object.keys(value).forEach(key => {
    const normalizedKey = key.toLowerCase().replace(/[^a-z]/g, '')
    if (
      SENSITIVE_ERROR_FIELDS[normalizedKey] === true ||
      normalizedKey.indexOf('authorization') !== -1 ||
      normalizedKey.indexOf('secret') !== -1 ||
      normalizedKey.indexOf('token') !== -1 ||
      normalizedKey.indexOf('signature') !== -1 ||
      normalizedKey.indexOf('document') !== -1 ||
      normalizedKey.indexOf('file') !== -1 ||
      normalizedKey.indexOf('content') !== -1 ||
      normalizedKey.indexOf('apikey') !== -1 ||
      normalizedKey.indexOf('requestsigningkey') !== -1
    ) {
      return
    }
    const safeValue = sanitizeErrorDetails(value[key])
    if (safeValue !== undefined) {
      details[key] = safeValue
    }
  })
  return details
}

function setHeader(
  headers: Record<string, string>,
  name: string,
  value: string
): void {
  const lowerName = name.toLowerCase()
  Object.keys(headers).forEach(existing => {
    if (existing.toLowerCase() === lowerName) {
      delete headers[existing]
    }
  })
  headers[name] = value
}

function removeReservedHeaders(
  headers: Record<string, string>
): Record<string, string> {
  const safeHeaders: Record<string, string> = {}
  Object.keys(headers).forEach(name => {
    if (!RESERVED_HEADERS[name.toLowerCase()]) {
      safeHeaders[name] = headers[name]
    }
  })
  return safeHeaders
}

function pathWithSegments(
  template: string,
  segments: Record<string, string> = {}
): string {
  return template.replace(/\{([^}]+)\}/g, (_match, name: string) => {
    const value = segments[name]
    if (value === undefined) {
      throw new Error(`Missing path value for ${name}`)
    }
    return encodeURIComponent(value)
  })
}

function validateMoneyInputs(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(item => validateMoneyInputs(item))
    return
  }
  if (!isRecord(value)) {
    return
  }
  Object.keys(value).forEach(key => {
    const field = value[key]
    if (
      /^(amount|cryptoAmount|fiatAmount|annual_intended_volume|gift_amount|gift_amount_local|gross_annual_income|gross_annual_income_local)$/.test(key) &&
      field !== undefined &&
      typeof field !== 'string'
    ) {
      throw new Error(`Rails monetary input '${key}' must be a decimal string.`)
    }
    validateMoneyInputs(field)
  })
}

function parseRailsResponse(text: string, operation: RailsOperationName): unknown {
  const exactMoney = operation === 'getOpenApi'
    ? text
    : text.replace(
        /("(?:amount|cryptoAmount|fiatAmount)"\s*:\s*)(-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)(?=\s*[,}\]])/g,
        '$1"$2"'
      )
  return JSON.parse(exactMoney) as unknown
}

function addQuery(url: URL, query?: object): void {
  if (!query) {
    return
  }

  const values = query as Record<string, unknown>
  const search = new URLSearchParams()
  Object.keys(values).forEach(name => {
    const value = values[name]
    if (value === undefined || value === null) {
      return
    }
    if (
      typeof value !== 'string' &&
      typeof value !== 'number' &&
      typeof value !== 'boolean'
    ) {
      throw new Error(`Invalid query value for ${name}`)
    }
    search.append(name, String(value))
  })
  const encoded = search.toString()
  if (encoded) {
    url.search = encoded
  }
}


export class RailsClient {
  constructor(
    private readonly opts: EnvironmentConfig,
    private readonly getCredentials: () => RequestCredentials | undefined,
    private readonly headers: Record<string, string> = {}
  ) {}

  getOpenApi(): Promise<RailsOpenApiDocument> {
    return this.request('getOpenApi')
  }

  getPartner(): Promise<RailsGetPartnerResponse> {
    return this.request('getPartner')
  }

  listCustomers(
    filters?: RailsListCustomersFilters
  ): Promise<RailsListCustomersResponse> {
    return this.request('listCustomers', { query: filters })
  }

  createCustomer(
    body: RailsCreateCustomerRequest,
    options?: RailsRequestOptions
  ): Promise<RailsCreateCustomerResponse> {
    return this.request('createCustomer', { body, options })
  }

  getCustomer(customerId: string): Promise<RailsGetCustomerResponse> {
    return this.request('getCustomer', {
      segments: { customer_id: customerId },
      customerId
    })
  }

  getCustomerKyc(customerId: string): Promise<RailsGetCustomerKycResponse> {
    return this.request('getCustomerKyc', {
      segments: { customer_id: customerId },
      customerId
    })
  }

  initiateCustomerKyc(
    customerId: string,
    options?: RailsRequestOptions
  ): Promise<RailsInitiateCustomerKycResponse> {
    return this.request('initiateCustomerKyc', {
      segments: { customer_id: customerId },
      customerId,
      options
    })
  }

  acceptCustomerTerms(
    customerId: string,
    body: RailsAcceptCustomerTermsRequest,
    options?: RailsRequestOptions
  ): Promise<RailsAcceptCustomerTermsResponse> {
    return this.request('acceptCustomerTerms', {
      segments: { customer_id: customerId },
      customerId,
      body,
      options
    })
  }

  getComplianceRequirements(
    customerId: string
  ): Promise<RailsGetComplianceRequirementsResponse> {
    return this.request('getComplianceRequirements', {
      segments: { customer_id: customerId },
      customerId
    })
  }

  confirmPersonalInformation(
    customerId: string,
    body: RailsConfirmPersonalInformationRequest,
    options?: RailsRequestOptions
  ): Promise<RailsConfirmPersonalInformationResponse> {
    return this.request('confirmPersonalInformation', {
      segments: { customer_id: customerId },
      customerId,
      body,
      options
    })
  }

  submitSourceOfFunds(
    customerId: string,
    body: RailsSubmitSourceOfFundsRequest,
    options?: RailsRequestOptions
  ): Promise<RailsSubmitSourceOfFundsResponse> {
    return this.request('submitSourceOfFunds', {
      segments: { customer_id: customerId },
      customerId,
      body,
      options
    })
  }

  answerComplianceRequest(
    customerId: string,
    requestId: string,
    body: RailsAnswerComplianceRequest,
    options?: RailsRequestOptions
  ): Promise<RailsAnswerComplianceResponse> {
    return this.request('answerComplianceRequest', {
      segments: { customer_id: customerId, request_id: requestId },
      customerId,
      body,
      options
    })
  }

  submitComplianceDocuments(
    customerId: string,
    requestId: string,
    documents: RailsSubmitComplianceDocumentsRequest,
    options?: RailsRequestOptions
  ): Promise<RailsSubmitComplianceDocumentsResponse> {
    const form = new FormData() as MultipartFormData
    const boundary = `--------------------------${randomBytes(24).toString('hex')}`
    form.setBoundary(boundary)
    documents.forEach(document => {
      const fileOptions: { filename: string; contentType?: string } = {
        filename: document.filename
      }
      if (document.contentType !== undefined) {
        fileOptions.contentType = document.contentType
      }
      form.append('documents[]', document.data, fileOptions)
    })

    // ponytail: buffers the full multipart body for exact hashing; spool to disk if unverified upload sizes exceed memory.
    const rawBody = form.getBuffer()
    const digest = createHash('sha256').update(rawBody).digest('hex')
    return this.request('submitComplianceDocuments', {
      segments: { customer_id: customerId, request_id: requestId },
      customerId,
      options,
      rawBody,
      contentType: `multipart/form-data; boundary=${boundary}`,
      contentDigest: digest
    })
  }

  listBlockchains(): Promise<RailsListBlockchainsResponse> {
    return this.request('listBlockchains')
  }

  createWalletChallenge(
    customerId: string,
    body: RailsCreateWalletChallengeRequest,
    options?: RailsRequestOptions
  ): Promise<RailsCreateWalletChallengeResponse> {
    return this.request('createWalletChallenge', { customerId, body, options })
  }

  registerWallet(
    customerId: string,
    body: RailsRegisterWalletRequest,
    options?: RailsRequestOptions
  ): Promise<RailsRegisterWalletResponse> {
    return this.request('registerWallet', { customerId, body, options })
  }

  listCustomerWallets(
    customerId: string
  ): Promise<RailsListCustomerWalletsResponse> {
    return this.request('listCustomerWallets', {
      segments: { customer_id: customerId },
      customerId
    })
  }

  verifyBankAccount(
    customerId: string,
    body: RailsVerifyBankAccountRequest,
    options?: RailsRequestOptions
  ): Promise<RailsVerifyBankAccountResponse> {
    return this.request('verifyBankAccount', { customerId, body, options })
  }

  listPaymentMethods(
    customerId: string
  ): Promise<RailsListPaymentMethodsResponse> {
    return this.request('listPaymentMethods', { customerId })
  }

  listQuotes(
    customerId: string,
    filters?: RailsListQuotesFilters
  ): Promise<RailsListQuotesResponse> {
    return this.request('listQuotes', { customerId, query: filters })
  }

  createQuote(
    customerId: string,
    body: RailsCreateQuoteRequest,
    options?: RailsRequestOptions
  ): Promise<RailsCreateQuoteResponse> {
    return this.request('createQuote', { customerId, body, options })
  }

  createDryQuote(
    customerId: string,
    body: RailsDryQuoteRequest,
    options?: RailsRequestOptions
  ): Promise<RailsDryQuoteResponse> {
    return this.request('createDryQuote', { customerId, body, options })
  }

  getQuote(
    customerId: string,
    quoteId: string
  ): Promise<RailsGetQuoteResponse> {
    return this.request('getQuote', {
      segments: { quote_id: quoteId },
      customerId
    })
  }

  cancelQuote(
    customerId: string,
    quoteId: string,
    options?: RailsRequestOptions
  ): Promise<RailsCancelQuoteResponse> {
    return this.request('cancelQuote', {
      segments: { quote_id: quoteId },
      customerId,
      options
    })
  }

  confirmBuy(
    customerId: string,
    quoteId: string,
    body: RailsConfirmBuyRequest,
    options?: RailsRequestOptions
  ): Promise<RailsConfirmBuyResponse> {
    return this.request('confirmBuy', {
      segments: { quote_id: quoteId },
      customerId,
      body,
      options
    })
  }

  confirmInstantBuy(
    customerId: string,
    quoteId: string,
    body: RailsConfirmInstantBuyRequest,
    options?: RailsRequestOptions
  ): Promise<RailsConfirmInstantBuyResponse> {
    return this.request('confirmInstantBuy', {
      segments: { quote_id: quoteId },
      customerId,
      body,
      options
    })
  }

  confirmSell(
    customerId: string,
    quoteId: string,
    body: RailsConfirmSellRequest,
    options?: RailsRequestOptions
  ): Promise<RailsConfirmSellResponse> {
    return this.request('confirmSell', {
      segments: { quote_id: quoteId },
      customerId,
      body,
      options
    })
  }

  recalculateQuote(
    customerId: string,
    quoteId: string,
    options?: RailsRequestOptions
  ): Promise<RailsRecalculateQuoteResponse> {
    return this.request('recalculateQuote', {
      segments: { quote_id: quoteId },
      customerId,
      options
    })
  }

  reconfirmQuote(
    customerId: string,
    quoteId: string,
    options?: RailsRequestOptions
  ): Promise<RailsReconfirmQuoteResponse> {
    return this.request('reconfirmQuote', {
      segments: { quote_id: quoteId },
      customerId,
      options
    })
  }

  listOrders(filters?: RailsListOrdersFilters): Promise<RailsListOrdersResponse> {
    return this.request('listOrders', { query: filters })
  }

  listWebhookSubscriptions(): Promise<RailsListWebhookSubscriptionsResponse> {
    return this.request('listWebhookSubscriptions')
  }

  createWebhookSubscription(
    body: RailsCreateWebhookSubscriptionRequest,
    options?: RailsRequestOptions
  ): Promise<RailsCreateWebhookSubscriptionResponse> {
    return this.request('createWebhookSubscription', { body, options })
  }

  cancelWebhookSubscription(
    subscriptionId: string,
    options?: RailsRequestOptions
  ): Promise<RailsCancelWebhookSubscriptionResponse> {
    return this.request('cancelWebhookSubscription', {
      segments: { subscription_id: subscriptionId },
      options
    })
  }

  rotateWebhookSecret(
    subscriptionId: string,
    options?: RailsRequestOptions
  ): Promise<RailsRotateWebhookSubscriptionResponse> {
    return this.request('rotateWebhookSecret', {
      segments: { subscription_id: subscriptionId },
      options
    })
  }

  listSubscriptionDeliveries(
    subscriptionId: string
  ): Promise<RailsListSubscriptionDeliveriesResponse> {
    return this.request('listSubscriptionDeliveries', {
      segments: { subscription_id: subscriptionId }
    })
  }

  listWebhookDeliveries(
    filters?: RailsListWebhookDeliveriesFilters
  ): Promise<RailsListWebhookDeliveriesResponse> {
    return this.request('listWebhookDeliveries', { query: filters })
  }

  listApiKeys(): Promise<RailsListApiKeysResponse> {
    return this.request('listApiKeys')
  }

  getApiKey(apiKeyId: string): Promise<RailsGetApiKeyResponse> {
    return this.request('getApiKey', {
      segments: { api_key_id: apiKeyId }
    })
  }

  revokeApiKey(
    apiKeyId: string,
    options?: RailsRequestOptions
  ): Promise<RailsRevokeApiKeyResponse> {
    return this.request('revokeApiKey', {
      segments: { api_key_id: apiKeyId },
      options
    })
  }

  fillDhPool(
    body: RailsFillDhPoolRequest,
    options?: RailsRequestOptions
  ): Promise<RailsFillDhPoolResponse> {
    return this.request('fillDhPool', { body, options })
  }

  completePayloadSignature(
    body: RailsCompletePayloadSignatureRequest,
    options?: RailsRequestOptions
  ): Promise<RailsCompletePayloadSignatureResponse> {
    return this.request('completePayloadSignature', { body, options })
  }

  completeBtcPayloadSignature(
    body: RailsCompleteBtcPayloadSignatureRequest,
    options?: RailsRequestOptions
  ): Promise<RailsCompleteBtcPayloadSignatureResponse> {
    return this.request('completeBtcPayloadSignature', { body, options })
  }

  sendRawTransaction(
    body: RailsSendRawTransactionRequest,
    options?: RailsRequestOptions
  ): Promise<RailsSendRawTransactionResponse> {
    return this.request('sendRawTransaction', { body, options })
  }

  prepareTransaction(
    body: RailsPrepareTransactionRequest,
    options?: RailsRequestOptions
  ): Promise<RailsPrepareTransactionResponse> {
    return this.request('prepareTransaction', { body, options })
  }

  iterateTransaction(
    body: RailsIterateTransactionRequest,
    options?: RailsRequestOptions
  ): Promise<RailsIterateTransactionResponse> {
    return this.request('iterateTransaction', { body, options })
  }

  cancelTransaction(
    body: RailsCancelTransactionRequest,
    options?: RailsRequestOptions
  ): Promise<RailsCancelTransactionResponse> {
    return this.request('cancelTransaction', { body, options })
  }

  private buildUrl(path: string, query?: object): URL {
    const base = this.opts.railsApiUrl
    if (!base) {
      throw new Error('Rails API base URL is required; configure railsApiUrl.')
    }
    if (base.indexOf('?') !== -1 || base.indexOf('#') !== -1) {
      throw new Error('Rails API base URL must not contain a query or fragment.')
    }

    let url: URL
    try {
      url = new URL(base)
    } catch {
      throw new Error('Rails API base URL must be an absolute URL.')
    }
    if (url.username || url.password) {
      throw new Error('Rails API base URL must not contain credentials.')
    }
    if (url.protocol !== 'https:' && !(this.opts.isLocal && url.protocol === 'http:')) {
      throw new Error('Rails API base URL must use HTTPS outside local development.')
    }

    const prefix = url.pathname.replace(/\/+$/, '')
    const relativePath = path.replace(/^\/+/, '')
    url.pathname = `${prefix}/${relativePath}`
    addQuery(url, query)
    return url
  }

  private async request<Response>(
    operation: RailsOperationName,
    args: DispatchOptions = {}
  ): Promise<Response> {
    const route = RAILS_ROUTES[operation] as RailsRoute
    const path = pathWithSegments(route.path, args.segments)
    if (
      args.body !== undefined &&
      (operation === 'createQuote' ||
        operation === 'createDryQuote' ||
        operation === 'submitSourceOfFunds')
    ) {
      validateMoneyInputs(args.body)
    }
    const url = this.buildUrl(path, args.query)
    const serializedBody =
      args.body === undefined ? undefined : JSON.stringify(args.body)
    const canonicalBody = args.contentDigest || serializedBody || ''
    const headers: Record<string, string> = { ...this.headers }
    const optionHeaders = args.options && args.options.headers
    if (optionHeaders) {
      Object.keys(optionHeaders).forEach(name => {
        setHeader(headers, name, optionHeaders[name])
      })
    }
    const idempotencyKey = args.options && args.options.idempotencyKey
    if (idempotencyKey !== undefined) {
      setHeader(headers, 'Idempotency-Key', idempotencyKey)
    }
    if (args.contentType !== undefined) {
      setHeader(headers, 'Content-Type', args.contentType)
    } else if (serializedBody !== undefined) {
      setHeader(headers, 'Content-Type', 'application/json')
    }

    let outgoingHeaders: Record<string, string>
    if (route.public) {
      outgoingHeaders = removeReservedHeaders(headers)
    } else {
      const credentials = this.getCredentials()
      if (!credentials || !credentials.apiKey || !credentials.requestKey) {
        throw new Error(
          'Rails API credentials are not initialized; sign in with an API key first.'
        )
      }
      outgoingHeaders = authenticatedHeaders(
        credentials,
        route.method,
        url,
        canonicalBody,
        args.customerId,
        headers,
        args.contentDigest
      )
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)
    try {
      const response = await fetch(url.toString(), {
        method: route.method,
        headers: outgoingHeaders,
        body: args.rawBody !== undefined ? args.rawBody : serializedBody,
        redirect: 'manual',
        signal: controller.signal
      })
      const responseText = await response.text()
      if (!response.ok) {
        throw this.createApiError(response.status, responseText)
      }
      return parseRailsResponse(responseText, operation) as Response
    } finally {
      clearTimeout(timeout)
    }
  }

  private createApiError(
    status: number,
    responseText: string
  ): RailsApiError {
    let parsed: unknown
    let parsedJson = false
    if (responseText) {
      try {
        parsed = JSON.parse(responseText) as unknown
        parsedJson = true
      } catch {
        parsed = undefined
      }
    }

    let code: string | undefined
    let backendMessage: string | undefined
    if (isRecord(parsed) && isRecord(parsed.error)) {
      if (typeof parsed.error.code === 'string') {
        code = parsed.error.code
      }
      if (typeof parsed.error.message === 'string') {
        backendMessage = parsed.error.message
      }
    }

    let details: unknown
    if (parsedJson && isRecord(parsed)) {
      details = sanitizeErrorDetails(parsed)
    } else if (!responseText) {
      details = { response: 'empty response body' }
    } else if (!parsedJson) {
      details = { response: 'non-JSON response body omitted' }
    } else {
      details = { response: 'JSON response contained no structured details' }
    }
    return new RailsApiError(status, code, backendMessage, details)
  }
}
