import { APIKey, PayloadAndKind, preSignPayload } from '@neon-exchange/nash-protocol'
import { initializeMpcRuntime } from '../mpcRuntime'
import { EnvironmentConfig } from '../environments'
import { RequestCredentials } from '../requestSigning'
import {
  RailsAcceptCustomerTermsRequest,
  RailsAcceptCustomerTermsResponse,
  RailsAnswerComplianceRequest,
  RailsAnswerComplianceResponse,
  RailsCancelQuoteResponse,
  RailsCancelWebhookSubscriptionResponse,
  RailsConfirmBuyRequest,
  RailsConfirmBuyResponse,
  RailsConfirmInstantBuyRequest,
  RailsConfirmInstantBuyResponse,
  RailsConfirmPersonalInformationRequest,
  RailsConfirmPersonalInformationResponse,
  RailsConfirmSellRequest,
  RailsConfirmSellResponse,
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
  RailsGetComplianceRequirementsResponse,
  RailsGetCustomerKycResponse,
  RailsGetCustomerResponse,
  RailsGetCustomerTermsResponse,
  RailsGetQuoteResponse,
  RailsInitiateCustomerKycResponse,
  RailsListBlockchainsResponse,
  RailsListWalletsResponse,
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
  RailsRecalculateQuoteResponse,
  RailsReconfirmQuoteResponse,
  RailsRegisterWalletRequest,
  RailsRegisterWalletResponse,
  RailsMpcSignedPayloadRequest,
  RailsRequestOptions,
  RailsRotateWebhookSubscriptionResponse,
  RailsSubmitComplianceDocumentsRequest,
  RailsSubmitComplianceDocumentsResponse,
  RailsSubmitSourceOfFundsRequest,
  RailsSubmitSourceOfFundsResponse,
  RailsVerifyBankAccountRequest,
  RailsVerifyBankAccountResponse
} from '../../types/rails'
import { RailsBaseClient } from './base'
import { CustomersClient } from './customers'
import { ComplianceClient } from './compliance'
import { WalletsClient } from './wallets'
import { OrdersClient } from './orders'
import { WebhooksClient } from './webhooks'

/** Flat public API composed from independent Rails domains. */
export class RailsClient extends RailsBaseClient {
  private readonly customers: CustomersClient
  private readonly compliance: ComplianceClient
  private readonly wallets: WalletsClient
  private readonly orders: OrdersClient
  private readonly webhooks: WebhooksClient

  constructor(
    opts: EnvironmentConfig,
    getCredentials: () => RequestCredentials | undefined,
    headers: Record<string, string> = {},
    private readonly getSigningKey: () => APIKey | undefined = () => undefined
  ) {
    super(opts, getCredentials, headers)
    this.customers = new CustomersClient(opts, getCredentials, headers)
    this.compliance = new ComplianceClient(opts, getCredentials, headers)
    this.wallets = new WalletsClient(opts, getCredentials, headers)
    this.orders = new OrdersClient(opts, getCredentials, headers)
    this.webhooks = new WebhooksClient(opts, getCredentials, headers)
  }

  /**
   * Sign a transaction payload using the current MPC API-key session.
   * Initializes the runtime and fills signing pools through Rails as needed.
   * Does not submit the transaction. Uses protocol camelCase payload fields.
   */
  async signPayload(payloadAndKind: PayloadAndKind): Promise<RailsMpcSignedPayloadRequest> {
    const secret = this.getSigningKey()
    if (!secret) {
      throw new Error('Rails payload signing requires an MPC API-key login.')
    }
    initializeMpcRuntime()
    const result = await preSignPayload(secret, payloadAndKind, {
      // Transaction payloads use neither; the type requires both.
      assetData: {},
      marketData: {},
      fillPoolFn: async ({ blockchain, client_dh_publics }) => {
        const response = await this.fillDhPool({ blockchain, dhPublics: client_dh_publics })
        if (!Array.isArray(response.dhFillPool) ||
            !response.dhFillPool.every(item => typeof item === 'string')) {
          throw new Error('Invalid Rails DH pool response: expected string public keys.')
        }
        return response.dhFillPool as string[]
      }
    })
    return {
      payload: result.payload,
      signature: {
        publicKey: secret.payload_public_key,
        signedDigest: result.signature
      }
    }
  }

  listCustomers(
    filters?: RailsListCustomersFilters
  ): Promise<RailsListCustomersResponse> {
    return this.customers.listCustomers(filters)
  }

  createCustomer(
    body: RailsCreateCustomerRequest,
    options?: RailsRequestOptions
  ): Promise<RailsCreateCustomerResponse> {
    return this.customers.createCustomer(body, options)
  }

  getCustomer(customerId: string): Promise<RailsGetCustomerResponse> {
    return this.customers.getCustomer(customerId)
  }

  getCustomerKyc(customerId: string): Promise<RailsGetCustomerKycResponse> {
    return this.customers.getCustomerKyc(customerId)
  }

  initiateCustomerKyc(
    customerId: string,
    options?: RailsRequestOptions
  ): Promise<RailsInitiateCustomerKycResponse> {
    return this.customers.initiateCustomerKyc(customerId, options)
  }

  getCustomerTerms(customerId: string): Promise<RailsGetCustomerTermsResponse> {
    return this.customers.getCustomerTerms(customerId)
  }

  acceptCustomerTerms(
    customerId: string,
    body: RailsAcceptCustomerTermsRequest,
    options?: RailsRequestOptions
  ): Promise<RailsAcceptCustomerTermsResponse> {
    return this.customers.acceptCustomerTerms(customerId, body, options)
  }

  getComplianceRequirements(
    customerId: string
  ): Promise<RailsGetComplianceRequirementsResponse> {
    return this.compliance.getComplianceRequirements(customerId)
  }

  confirmPersonalInformation(
    customerId: string,
    body: RailsConfirmPersonalInformationRequest,
    options?: RailsRequestOptions
  ): Promise<RailsConfirmPersonalInformationResponse> {
    return this.compliance.confirmPersonalInformation(customerId, body, options)
  }

  submitSourceOfFunds(
    customerId: string,
    body: RailsSubmitSourceOfFundsRequest,
    options?: RailsRequestOptions
  ): Promise<RailsSubmitSourceOfFundsResponse> {
    return this.compliance.submitSourceOfFunds(customerId, body, options)
  }

  answerComplianceRequest(
    customerId: string,
    requestId: string,
    body: RailsAnswerComplianceRequest,
    options?: RailsRequestOptions
  ): Promise<RailsAnswerComplianceResponse> {
    return this.compliance.answerComplianceRequest(customerId, requestId, body, options)
  }

  submitComplianceDocuments(
    customerId: string,
    requestId: string,
    documents: RailsSubmitComplianceDocumentsRequest,
    options?: RailsRequestOptions
  ): Promise<RailsSubmitComplianceDocumentsResponse> {
    return this.compliance.submitComplianceDocuments(customerId, requestId, documents, options)
  }

  listBlockchains(): Promise<RailsListBlockchainsResponse> {
    return this.wallets.listBlockchains()
  }

  createWalletChallenge(
    customerId: string | null,
    body: RailsCreateWalletChallengeRequest,
    options?: RailsRequestOptions
  ): Promise<RailsCreateWalletChallengeResponse> {
    return this.wallets.createWalletChallenge(customerId, body, options)
  }

  registerWallet(
    customerId: string | null,
    body: RailsRegisterWalletRequest,
    options?: RailsRequestOptions
  ): Promise<RailsRegisterWalletResponse> {
    return this.wallets.registerWallet(customerId, body, options)
  }

  listWallets(customerId: string | null): Promise<RailsListWalletsResponse> {
    return this.wallets.listWallets(customerId)
  }

  verifyBankAccount(
    customerId: string | null,
    body: RailsVerifyBankAccountRequest,
    options?: RailsRequestOptions
  ): Promise<RailsVerifyBankAccountResponse> {
    return this.wallets.verifyBankAccount(customerId, body, options)
  }

  listPaymentMethods(
    customerId: string | null
  ): Promise<RailsListPaymentMethodsResponse> {
    return this.wallets.listPaymentMethods(customerId)
  }

  listQuotes(
    customerId: string | null,
    filters?: RailsListQuotesFilters
  ): Promise<RailsListQuotesResponse> {
    return this.orders.listQuotes(customerId, filters)
  }

  createQuote(
    customerId: string | null,
    body: RailsCreateQuoteRequest,
    options?: RailsRequestOptions
  ): Promise<RailsCreateQuoteResponse> {
    return this.orders.createQuote(customerId, body, options)
  }

  createDryQuote(
    customerId: string | null,
    body: RailsDryQuoteRequest,
    options?: RailsRequestOptions
  ): Promise<RailsDryQuoteResponse> {
    return this.orders.createDryQuote(customerId, body, options)
  }

  getQuote(
    customerId: string | null,
    quoteId: string
  ): Promise<RailsGetQuoteResponse> {
    return this.orders.getQuote(customerId, quoteId)
  }

  cancelQuote(
    customerId: string | null,
    quoteId: string,
    options?: RailsRequestOptions
  ): Promise<RailsCancelQuoteResponse> {
    return this.orders.cancelQuote(customerId, quoteId, options)
  }

  confirmBuy(
    customerId: string | null,
    quoteId: string,
    body: RailsConfirmBuyRequest,
    options?: RailsRequestOptions
  ): Promise<RailsConfirmBuyResponse> {
    return this.orders.confirmBuy(customerId, quoteId, body, options)
  }

  confirmInstantBuy(
    customerId: string | null,
    quoteId: string,
    body: RailsConfirmInstantBuyRequest,
    options?: RailsRequestOptions
  ): Promise<RailsConfirmInstantBuyResponse> {
    return this.orders.confirmInstantBuy(customerId, quoteId, body, options)
  }

  confirmSell(
    customerId: string | null,
    quoteId: string,
    body: RailsConfirmSellRequest,
    options?: RailsRequestOptions
  ): Promise<RailsConfirmSellResponse> {
    return this.orders.confirmSell(customerId, quoteId, body, options)
  }

  recalculateQuote(
    customerId: string | null,
    quoteId: string,
    options?: RailsRequestOptions
  ): Promise<RailsRecalculateQuoteResponse> {
    return this.orders.recalculateQuote(customerId, quoteId, options)
  }

  reconfirmQuote(
    customerId: string | null,
    quoteId: string,
    options?: RailsRequestOptions
  ): Promise<RailsReconfirmQuoteResponse> {
    return this.orders.reconfirmQuote(customerId, quoteId, options)
  }

  listOrders(filters?: RailsListOrdersFilters): Promise<RailsListOrdersResponse> {
    return this.orders.listOrders(filters)
  }

  listWebhookSubscriptions(): Promise<RailsListWebhookSubscriptionsResponse> {
    return this.webhooks.listWebhookSubscriptions()
  }

  createWebhookSubscription(
    body: RailsCreateWebhookSubscriptionRequest,
    options?: RailsRequestOptions
  ): Promise<RailsCreateWebhookSubscriptionResponse> {
    return this.webhooks.createWebhookSubscription(body, options)
  }

  cancelWebhookSubscription(
    subscriptionId: string,
    options?: RailsRequestOptions
  ): Promise<RailsCancelWebhookSubscriptionResponse> {
    return this.webhooks.cancelWebhookSubscription(subscriptionId, options)
  }

  rotateWebhookSecret(
    subscriptionId: string,
    options?: RailsRequestOptions
  ): Promise<RailsRotateWebhookSubscriptionResponse> {
    return this.webhooks.rotateWebhookSecret(subscriptionId, options)
  }

  listSubscriptionDeliveries(
    subscriptionId: string
  ): Promise<RailsListSubscriptionDeliveriesResponse> {
    return this.webhooks.listSubscriptionDeliveries(subscriptionId)
  }

  listWebhookDeliveries(
    filters?: RailsListWebhookDeliveriesFilters
  ): Promise<RailsListWebhookDeliveriesResponse> {
    return this.webhooks.listWebhookDeliveries(filters)
  }
}
