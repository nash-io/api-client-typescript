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
  | 'order.created'
  | 'order.status_changed'
  | 'quote.created'
  | 'quote.expired'
  | 'quote.updated'
  | 'wallet.verified'

export interface RailsWebhookSubscription {
  id: string
  url: string
  events: RailsWebhookEvent[]
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
  outcome: 'delivered' | 'failed'
  attemptedAt: string
  durationMs?: number
  error?: string
  responseStatus?: number
}

export type RailsWebhookDeliveryStatus = 'pending' | 'delivered' | 'failed' | 'skipped'

export interface RailsWebhookDelivery {
  id: string
  subscriptionId: string
  sequence: number
  eventId: string
  eventType: RailsWebhookEvent
  environment: RailsEnvironment
  status: RailsWebhookDeliveryStatus
  attemptsCount: number
  attempts: RailsWebhookDeliveryAttempt[]
  deliveredAt?: string
  lastAttemptedAt?: string
  lastError?: string
  lastResponseStatus?: number
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
export type RailsListSubscriptionDeliveriesResponse = RailsWebhookDeliveriesResponse
export type RailsListWebhookDeliveriesResponse = RailsWebhookDeliveryPage
