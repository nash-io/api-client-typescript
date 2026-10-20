import {
  RailsCurrency,
  RailsEnvironment,
  RailsMonetaryAmount
} from './common'

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
  status: string
  blockchain: string
  settlementType: string
  settlementAddress: string | null
  fiatAsset: string | null
  fiatAmount: string | null
  cryptoAmount: string | null
  confirmUntil: string | null
  reconfirmUntil: string | null
  transferUntil: string | null
  bankDepositInstructions: RailsBankDepositInstructions | null
  cryptoDepositInstructions: RailsCryptoDepositInstructions | null
}

export interface RailsQuoteRequest {
  type: 'buy' | 'sell'
  blockchain: string
  cryptoAsset: string
  fiatAsset: string
  capQuantityToMaximum?: boolean
  cryptoAmount?: RailsMonetaryAmount
  fiatAmount?: RailsMonetaryAmount
  gasLevel?: 'price_low' | 'price_medium' | 'price_high'
  metaData?: Record<string, unknown>
  settlementType?: 'personal_wallet'
  uniqueKey?: string
  [key: string]: unknown
}

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
  status: string
  inserted_at: string
}

export interface RailsQuoteHistoryResponse {
  environment: RailsEnvironment
  quotes: Array<RailsQuote | RailsHistoryOrder>
  cursor: string | null
}

export interface RailsQuoteConfirmationRequest {
  settlementAddress: string
  paymentMethodId?: string
  signatureForPermitTransfer?: string
  sourceOfFunds?: Record<string, unknown>
  userPlatform?: 'browser' | 'android' | 'ios'
  [key: string]: unknown
}

export interface RailsInstantBuyConfirmationResponse {
  environment: RailsEnvironment
  quote?: RailsQuote
}

export interface RailsOrder {
  id: string
  status: string
  createdAt: string
  blockchain?: string
  completedAt?: string
  cryptoAmount?: string
  fiatAmount?: string
  settlementAddress?: string
  type?: string
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
export type RailsConfirmInstantBuyRequest = RailsQuoteConfirmationRequest
export type RailsConfirmInstantBuyResponse = RailsInstantBuyConfirmationResponse
export type RailsConfirmSellRequest = RailsQuoteConfirmationRequest
export type RailsConfirmSellResponse = RailsQuoteResponse
export type RailsRecalculateQuoteResponse = RailsQuoteResponse
export type RailsReconfirmQuoteResponse = RailsQuoteResponse
export type RailsListOrdersResponse = RailsOrderPage
