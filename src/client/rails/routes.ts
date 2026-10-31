import { RailsRequestOptions } from '../../types/rails'

export interface RailsRoute {
  method: 'GET' | 'POST' | 'DELETE'
  path: string
  public?: boolean
}

export const RAILS_ROUTES = {
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
  getCustomerTerms: { method: 'GET', path: '/customers/{customer_id}/terms' },
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
  listWallets: { method: 'GET', path: '/wallets' },
  verifyBankAccount: { method: 'POST', path: '/bank-accounts' },
  listPaymentMethods: { method: 'GET', path: '/payment-methods' },
  listQuotes: { method: 'GET', path: '/quotes' },
  createQuote: { method: 'POST', path: '/quotes' },
  createDryQuote: { method: 'POST', path: '/quotes/dry-quote' },
  getQuote: { method: 'GET', path: '/quotes/{quote_id}' },
  cancelQuote: { method: 'POST', path: '/quotes/{quote_id}/cancel' },
  confirmBuy: { method: 'POST', path: '/quotes/{quote_id}/confirm-buy' },
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
  getBlockchainFees: { method: 'GET', path: '/transactions/blockchain-fees' },
  fillDhPool: { method: 'POST', path: '/transactions/signatures/dh-pool' },
  prepareTransaction: { method: 'POST', path: '/transactions/prepare' },
  iterateTransaction: { method: 'POST', path: '/transactions/iterate' },
  cancelTransaction: { method: 'POST', path: '/transactions/cancel' }
} as const

export type RailsOperationName = keyof typeof RAILS_ROUTES

export interface DispatchOptions {
  segments?: Record<string, string>
  query?: object
  /** Customer id, or null to act as the partner itself (nash-act-as: partner). */
  customerId?: string | null
  body?: unknown
  rawBody?: Buffer
  contentType?: string
  contentDigest?: string
  options?: RailsRequestOptions
}
