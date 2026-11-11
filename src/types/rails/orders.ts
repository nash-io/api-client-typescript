import {
  RailsCryptoQuantity,
  RailsCryptoQuantityInput,
  RailsEnvironment,
  RailsFiatQuantity,
  RailsRate
} from './common'
import { RailsBlockchain } from './wallets'

export type RailsSettlementType =
  | 'CHANNELS'
  | 'PERSONAL_WALLET'
  | 'SAVINGS_CONTRACT'

export type RailsOrderStatus =
  | 'CANCELLED_BY_USER'
  | 'CANCELLED_BY_ADMIN'
  | 'PENDING_USER_CONFIRMATION'
  | 'CONFIRMED_WAITING_FOR_PAYMENT'
  | 'PENDING_ADMIN_APPROVAL'
  | 'PENDING_RECALCULATION'
  | 'PROCESSING_PAYMENT'
  | 'SOURCING_TOKENS'
  | 'PROCESSING_SETTLEMENT'
  | 'PENDING_USER_RATE_RECONFIRMATION'
  | 'RECONFIRMATION_REJECTED'
  | 'RECONFIRMATION_EXPIRED'
  | 'COMPLETED'
  | 'PENDING_REFUND'
  | 'REJECTED_PENDING_REFUND'
  | 'REFUNDED'
  | 'REJECTED_REFUNDED'
  | 'FAILED_EXPIRED_ON_CONFIRMATION'
  | 'FAILED_EXPIRED_ON_BANK_TRANSFER'
  | 'FAILED_EXPIRED_ON_CRYPTO_TRANSFER'
  | 'PENDING_DEPOSIT_VERIFICATION'
  | 'PAYMENT_RECEIVED'
  | 'RECALCULATION_COMPLETED'
  | 'ORDER_DERISKED'
  | 'APPROVED'

export type RailsHistoryOrderStatus =
  | 'PENDING_USER_CONFIRMATION'
  | 'CONFIRMED_WAITING_FOR_PAYMENT'
  | 'FAILED_EXPIRED_ON_CONFIRMATION'
  | 'FAILED_EXPIRED_ON_BANK_TRANSFER'
  | 'PENDING_ADMIN_APPROVAL'
  | 'PENDING_RECALCULATION'
  | 'SOURCING_TOKENS'
  | 'PROCESSING_SETTLEMENT'
  | 'COMPLETED'
  | 'REJECTED_PENDING_REFUND'
  | 'REJECTED_REFUNDED'

export interface RailsBankDepositInstructions {
  recipientName: string | null
  iban: string | null
  bic: string | null
  accountNumber: string | null
  sortCode: string | null
  referenceCode: string | null
  recipientBankCountry: string | null
  recipientAddress: {
    line1?: string | null
    line2?: string | null
    line3?: string | null
  } | null
}

export interface RailsCryptoDepositInstructions {
  destinationAddress: string | null
}

export interface RailsQuote {
  id: string
  type: 'BUY' | 'SELL'
  status: RailsOrderStatus
  blockchain: RailsBlockchain
  settlementType: RailsSettlementType
  settlementAddress: string | null
  walletAddress: string | null
  transferMethod: 'DEPOSIT' | 'PERMIT' | null
  permitTransferDigest: string | null
  kind: 'QUOTE'
  createdAt: string
  completedAt: string | null
  fiatAsset: string | null
  fiatAmount: RailsFiatQuantity
  cryptoAsset: string | null
  cryptoAmount: RailsCryptoQuantity
  rate: RailsRate
  confirmUntil: string | null
  reconfirmUntil: string | null
  transferUntil: string | null
  bankDepositInstructions: RailsBankDepositInstructions | null
  cryptoDepositInstructions: RailsCryptoDepositInstructions | null
}

export type RailsQuoteRequest = {
  blockchain: RailsBlockchain
  cryptoAsset: string
  fiatAsset: string
  /** Verified external wallet bound immutably when the quote is created. */
  walletAddress: string
  cryptoAmount?: RailsCryptoQuantityInput
  fiatAmount?: RailsFiatQuantity
  uniqueKey?: string
} & (
  | { type: 'BUY'; transferMethod?: never }
  | { type: 'SELL'; transferMethod?: 'DEPOSIT' | 'PERMIT' }
)

export interface RailsQuoteResponse {
  environment: RailsEnvironment
  quote: RailsQuote
}

export interface RailsQuoteEstimationResponse {
  environment: RailsEnvironment
  type: 'BUY' | 'SELL'
  fixedValue: 'FIAT' | 'CRYPTO'
  fiatAmount: RailsFiatQuantity
  cryptoAmount: RailsCryptoQuantity
  cryptoAmountAfterSettlement: RailsCryptoQuantity | null
  settlementNetworkFee: RailsCryptoQuantity
  rate: RailsRate
}

export interface RailsHistoryOrder {
  id: string
  status: RailsHistoryOrderStatus
  createdAt: string
  kind: 'ORDER'
}

export interface RailsQuoteHistoryResponse {
  environment: RailsEnvironment
  quotes: Array<RailsQuote | RailsHistoryOrder>
  nextCursor: string | null
}

export interface RailsQuoteConfirmationRequest {
  paymentMethodId?: string
  signatureForPermitTransfer?: string
  sourceOfFunds?: string
}

export interface RailsOrder {
  id: string
  status: RailsOrderStatus
  createdAt: string
  blockchain?: RailsBlockchain
  completedAt?: string
  cryptoAmount?: RailsCryptoQuantity
  cryptoAsset?: string
  fiatAmount?: RailsFiatQuantity
  fiatAsset?: string
  settlementAddress?: string
  type?: 'BUY' | 'SELL'
}

export interface RailsOrderPage {
  environment: RailsEnvironment
  orders: RailsOrder[]
  nextCursor: string | null
}
export interface RailsListQuotesFilters {
  cursor?: string
  limit?: number
}

export interface RailsListOrdersFilters {
  customer_id?: string
  /** List only the partner account's own orders; not combinable with customer_id. */
  partner_orders_only?: boolean
  cursor?: string
  limit?: number
}

export type RailsListQuotesResponse = RailsQuoteHistoryResponse
export type RailsCreateQuoteRequest = RailsQuoteRequest
export type RailsCreateQuoteResponse = RailsQuoteResponse
export type RailsDryQuoteRequest = RailsQuoteRequest
export type RailsDryQuoteResponse = RailsQuoteEstimationResponse
export type RailsGetQuoteResponse = RailsQuoteResponse
export type RailsCancelQuoteResponse = RailsQuoteResponse
export type RailsConfirmBuyRequest = RailsQuoteConfirmationRequest
export type RailsConfirmBuyResponse = RailsQuoteResponse
export type RailsConfirmSellRequest = RailsQuoteConfirmationRequest & {
  paymentMethodId: string
}
export type RailsConfirmSellResponse = RailsQuoteResponse
export type RailsRecalculateQuoteResponse = RailsQuoteResponse
export type RailsReconfirmQuoteResponse = RailsQuoteResponse
export type RailsListOrdersResponse = RailsOrderPage

export type RailsAssetSideStatus = 'AVAILABLE' | 'DISABLED_HIDDEN' | 'UNDER_MAINTENANCE'

export interface RailsAssetRateSide {
  price: RailsRate
  priceAfterFee: RailsRate
  status: RailsAssetSideStatus
}

export interface RailsAssetRate {
  assetHash: string
  blockchain: RailsBlockchain
  blockchainPrecision: number
  name: string
  symbol: string
  buy: RailsAssetRateSide
  sell: RailsAssetRateSide
}

export interface RailsGetAssetRatesResponse {
  environment: RailsEnvironment
  rates: RailsAssetRate[]
}
