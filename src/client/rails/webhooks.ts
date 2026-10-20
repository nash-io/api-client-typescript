import {
  RailsCancelWebhookSubscriptionResponse,
  RailsCreateWebhookSubscriptionRequest,
  RailsCreateWebhookSubscriptionResponse,
  RailsListSubscriptionDeliveriesResponse,
  RailsListWebhookDeliveriesFilters,
  RailsListWebhookDeliveriesResponse,
  RailsListWebhookSubscriptionsResponse,
  RailsRequestOptions,
  RailsRotateWebhookSubscriptionResponse
} from '../../types/rails'
import { OrdersClient } from './orders'

export class RailsClient extends OrdersClient {
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
}
