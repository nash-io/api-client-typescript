import {
  RailsCurrency,
  RailsEnvironment,
  RailsMonetaryAmount
} from './common'

export type RailsQuoteBlockchain =
  | 'eth'
  | 'avaxc'
  | 'polygon'
  | 'arbitrum'
  | 'neo_x'
  | 'bnb'
  | 'base'
  | 'mantle'
  | 'optimism'
  | 'neo3'
  | 'btc'
  | 'solana'

export type RailsSettlementType =
  | 'channels'
  | 'personal_wallet'
  | 'savings_contract'

export type RailsOrderStatus =
  | 'cancelled_by_user'
  | 'cancelled_by_admin'
  | 'pending_user_confirmation'
  | 'confirmed_waiting_for_payment'
  | 'pending_admin_approval'
  | 'pending_recalculation'
  | 'processing_payment'
  | 'sourcing_tokens'
  | 'processing_settlement'
  | 'pending_user_rate_reconfirmation'
  | 'reconfirmation_rejected'
  | 'reconfirmation_expired'
  | 'completed'
  | 'pending_refund'
  | 'rejected_pending_refund'
  | 'refunded'
  | 'rejected_refunded'
  | 'failed_expired_on_confirmation'
  | 'failed_expired_on_bank_transfer'
  | 'failed_expired_on_crypto_transfer'
  | 'pending_deposit_verification'
  | 'payment_received'
  | 'recalculation_completed'
  | 'order_derisked'
  | 'approved'

export type RailsHistoryOrderStatus =
  | 'pending_user_confirmation'
  | 'confirmed_waiting_for_payment'
  | 'failed_expired_on_confirmation'
  | 'failed_expired_on_bank_transfer'
  | 'pending_admin_approval'
  | 'pending_recalculation'
  | 'sourcing_tokens'
  | 'processing_settlement'
  | 'completed'
  | 'rejected_pending_refund'
  | 'rejected_refunded'

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
  type: 'buy' | 'sell'
  status: RailsOrderStatus
  blockchain: RailsQuoteBlockchain
  settlementType: RailsSettlementType
  settlementAddress: string | null
  walletAddress: string | null
  transferMethod: 'deposit' | 'permit' | null
  permitTransferDigest: string | null
  fiatAsset: string | null
  fiatAmount: string | null
  cryptoAsset: string | null
  cryptoAmount: string | null
  rate: string | null
  confirmUntil: string | null
  reconfirmUntil: string | null
  transferUntil: string | null
  bankDepositInstructions: RailsBankDepositInstructions | null
  cryptoDepositInstructions: RailsCryptoDepositInstructions | null
}

export type RailsQuoteRequest = {
  blockchain: RailsQuoteBlockchain
  cryptoAsset: string
  fiatAsset: string
  /** Verified external wallet bound immutably when the quote is created. */
  walletAddress: string
  cryptoAmount?: RailsMonetaryAmount
  fiatAmount?: RailsMonetaryAmount
  uniqueKey?: string
} & (
  | { type: 'buy'; transferMethod?: never }
  | { type: 'sell'; transferMethod?: 'deposit' | 'permit' }
)

export interface RailsQuoteResponse {
  environment: RailsEnvironment
  quote: RailsQuote
}

export interface RailsQuoteEstimationResponse {
  environment: RailsEnvironment
  side: 'buy' | 'sell'
  fixedValue: 'base' | 'target'
  base: RailsCurrency | null
  target: RailsCurrency | null
  targetAfterSettlement: RailsCurrency | null
  settlementNetworkFee: RailsCurrency | null
  rateAmount: string | null
}

export interface RailsHistoryOrder {
  id: string
  status: RailsHistoryOrderStatus
  createdAt: string
  type?: never
}

export interface RailsQuoteHistoryResponse {
  environment: RailsEnvironment
  quotes: Array<RailsQuote | RailsHistoryOrder>
  cursor: string | null
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
  blockchain?: RailsQuoteBlockchain
  completedAt?: string
  cryptoAmount?: string
  cryptoAsset?: string
  fiatAmount?: string
  fiatAsset?: string
  settlementAddress?: string
  type?: 'buy' | 'sell'
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
