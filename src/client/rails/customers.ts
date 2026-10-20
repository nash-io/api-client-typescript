import {
  RailsAcceptCustomerTermsRequest,
  RailsAcceptCustomerTermsResponse,
  RailsCreateCustomerRequest,
  RailsCreateCustomerResponse,
  RailsGetCustomerKycResponse,
  RailsGetCustomerResponse,
  RailsInitiateCustomerKycResponse,
  RailsListCustomersFilters,
  RailsListCustomersResponse,
  RailsRequestOptions
} from '../../types/rails'
import { RailsBaseClient } from './base'

export class CustomersClient extends RailsBaseClient {
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
}
