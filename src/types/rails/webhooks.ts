import { RailsEnvironment } from './common'

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
