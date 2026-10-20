import {
  RailsCreateWalletChallengeRequest,
  RailsCreateWalletChallengeResponse,
  RailsListBlockchainsResponse,
  RailsListCustomerWalletsResponse,
  RailsListPaymentMethodsResponse,
  RailsRegisterWalletRequest,
  RailsRegisterWalletResponse,
  RailsRequestOptions,
  RailsVerifyBankAccountRequest,
  RailsVerifyBankAccountResponse
} from '../../types/rails'
import { ComplianceClient } from './compliance'

export class WalletsClient extends ComplianceClient {
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
}
