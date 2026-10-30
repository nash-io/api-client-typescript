import {
  RailsCancelQuoteResponse,
  RailsConfirmBuyRequest,
  RailsConfirmBuyResponse,
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
import { RailsBaseClient } from './base'

export class OrdersClient extends RailsBaseClient {
  listQuotes(
    customerId: string | null,
    filters?: RailsListQuotesFilters
  ): Promise<RailsListQuotesResponse> {
    return this.request('listQuotes', { customerId, query: filters })
  }

  createQuote(
    customerId: string | null,
    body: RailsCreateQuoteRequest,
    options?: RailsRequestOptions
  ): Promise<RailsCreateQuoteResponse> {
    return this.request('createQuote', { customerId, body, options })
  }

  createDryQuote(
    customerId: string | null,
    body: RailsDryQuoteRequest,
    options?: RailsRequestOptions
  ): Promise<RailsDryQuoteResponse> {
    return this.request('createDryQuote', { customerId, body, options })
  }

  getQuote(
    customerId: string | null,
    quoteId: string
  ): Promise<RailsGetQuoteResponse> {
    return this.request('getQuote', {
      segments: { quote_id: quoteId },
      customerId
    })
  }

  cancelQuote(
    customerId: string | null,
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
    customerId: string | null,
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

  confirmSell(
    customerId: string | null,
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
    customerId: string | null,
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
    customerId: string | null,
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
