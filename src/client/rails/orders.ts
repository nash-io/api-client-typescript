import {
  RailsCancelQuoteResponse,
  RailsConfirmBuyRequest,
  RailsConfirmBuyResponse,
  RailsConfirmInstantBuyRequest,
  RailsConfirmInstantBuyResponse,
  RailsConfirmSellRequest,
  RailsConfirmSellResponse,
  RailsCreateQuoteRequest,
  RailsCreateQuoteResponse,
  RailsDryQuoteRequest,
  RailsDryQuoteResponse,
  RailsGetQuoteResponse,
  RailsListOrdersFilters,
  RailsListOrdersResponse,
  RailsListQuotesFilters,
  RailsListQuotesResponse,
  RailsRecalculateQuoteResponse,
  RailsReconfirmQuoteResponse,
  RailsRequestOptions
} from '../../types/rails'
import { WalletsClient } from './wallets'

export class OrdersClient extends WalletsClient {
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
}
