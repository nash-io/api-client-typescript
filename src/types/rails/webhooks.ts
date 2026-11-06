import { RailsEnvironment } from './common'

export interface RailsWebhookSubscriptionCreationRequest {
  url: string
  events: RailsWebhookEvent[]
  secret?: string
}

export type RailsWebhookEvent =
  | 'compliance.request'
  | 'iban.verified'
  | 'kyc.updated'
  | 'order.status_changed'
  | 'quote.cancelled'
  | 'quote.created'
  | 'quote.expired'
  | 'quote.updated'
  | 'wallet.verified'

export type RailsWebhookEventType =
  | 'KYC_UPDATED'
  | 'COMPLIANCE_REQUEST'
  | 'QUOTE_CREATED'
  | 'QUOTE_UPDATED'
  | 'QUOTE_EXPIRED'
  | 'QUOTE_CANCELLED'
  | 'ORDER_STATUS_CHANGED'
  | 'WALLET_VERIFIED'
  | 'IBAN_VERIFIED'

export interface RailsWebhookSubscription {
  id: string
  url: string
  events: RailsWebhookEventType[]
  environment: RailsEnvironment
  active: boolean
  cancelledAt?: string
  createdAt?: string
  updatedAt?: string
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
  outcome: 'DELIVERED' | 'FAILED'
  attemptedAt: string
  durationMs?: number
  error?: string
  responseStatus?: number
}

export type RailsWebhookDeliveryStatus = 'PENDING' | 'DELIVERED' | 'FAILED' | 'SKIPPED'

export interface RailsWebhookDelivery {
  id: string
  subscriptionId: string
  sequence: number
  eventId: string
  eventType: RailsWebhookEventType
  environment: RailsEnvironment
  status: RailsWebhookDeliveryStatus
  attemptsCount: number
  attempts: RailsWebhookDeliveryAttempt[]
  deliveredAt?: string
  lastAttemptedAt?: string
  lastError?: string
  lastResponseStatus?: number
}

export interface RailsWebhookDeliveryPage {
  environment: RailsEnvironment
  deliveries: RailsWebhookDelivery[]
  nextCursor: string | null
}

export interface RailsListWebhookDeliveriesFilters {
  subscription_id?: string
  cursor?: string
  limit?: number
}

export type RailsListWebhookSubscriptionsResponse = RailsWebhookSubscriptionsResponse
export type RailsCreateWebhookSubscriptionRequest = RailsWebhookSubscriptionCreationRequest
export type RailsCreateWebhookSubscriptionResponse = RailsIssuedWebhookSubscriptionResponse
export type RailsCancelWebhookSubscriptionResponse = RailsWebhookSubscriptionResponse
export type RailsRotateWebhookSubscriptionResponse = RailsIssuedWebhookSubscriptionResponse
export type RailsListWebhookDeliveriesResponse = RailsWebhookDeliveryPage
