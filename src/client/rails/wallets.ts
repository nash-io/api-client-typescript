import {
  RailsCreateWalletChallengeRequest,
  RailsCreateWalletChallengeResponse,
  RailsListBlockchainsResponse,
  RailsListWalletsResponse,
  RailsListPaymentMethodsResponse,
  RailsRegisterWalletRequest,
  RailsRegisterWalletResponse,
  RailsRequestOptions,
  RailsVerifyBankAccountRequest,
  RailsVerifyBankAccountResponse
} from '../../types/rails'
import { RailsBaseClient } from './base'

export class WalletsClient extends RailsBaseClient {
  listBlockchains(): Promise<RailsListBlockchainsResponse> {
    return this.request('listBlockchains')
  }

  createWalletChallenge(
    customerId: string | null,
    body: RailsCreateWalletChallengeRequest,
    options?: RailsRequestOptions
  ): Promise<RailsCreateWalletChallengeResponse> {
    return this.request('createWalletChallenge', { customerId, body, options })
  }

  registerWallet(
    customerId: string | null,
    body: RailsRegisterWalletRequest,
    options?: RailsRequestOptions
  ): Promise<RailsRegisterWalletResponse> {
    return this.request('registerWallet', { customerId, body, options })
  }

  listWallets(customerId: string | null): Promise<RailsListWalletsResponse> {
    return this.request('listWallets', { customerId })
  }

  verifyBankAccount(
    customerId: string | null,
    body: RailsVerifyBankAccountRequest,
    options?: RailsRequestOptions
  ): Promise<RailsVerifyBankAccountResponse> {
    return this.request('verifyBankAccount', { customerId, body, options })
  }

  listPaymentMethods(
    customerId: string | null
  ): Promise<RailsListPaymentMethodsResponse> {
    return this.request('listPaymentMethods', { customerId })
  }
}
