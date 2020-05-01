import * as AbsintheSocket from '@absinthe/socket'
import { Socket as PhoenixSocket } from 'phoenix-channels'

import {
  OrderBook,
  Ticker,
  Trade,
  CandleRange,
  CandleInterval,
  Order,
  DateTime,
  OrderBuyOrSell,
  OrderStatus,
  OrderType
} from '../types'

export enum ClientMode {
  NONE = 'NONE',
  MPC = 'MPC',
  FULL_SECRET = 'FULL_SECRET'
}
/**
 * These interfaces are just here to
 */
interface GQLQueryParams<V> {
  query: any
  variables?: V
}
interface GQLMutationParams<V> {
  mutation: any
  variables?: V
}

interface GQLError {
  message: string
}

export interface GQLResp<T> {
  data: T
  errors?: GQLError[]
}

export interface GQL {
  query<T = any, V = any>(params: GQLQueryParams<V>): Promise<GQLResp<T>>
  mutate<T = any, V = any>(params: GQLMutationParams<V>): Promise<GQLResp<T>>
}

interface SubscriptionHandlers<T> {
  onResult: (p: T) => void
  onError: (p: Error) => void
  onAbort: (p: Error) => void
  onStart: (p: object) => void
}

export interface PayloadSignature {
  payload: Record<string, any>
  signature: {
    publicKey: string
    signedDigest: string
  }
  blockchain_data: {
    address: string
    amount: string
    asset: string
    nonce: string
    prefix: string
    r?: string
    userPubKey: string
    userSig?: string
  }
  blockchain_raw: string
  signedPayload: Record<string, any>
}

export interface NashSocketEvents {
  /**
   * See https://www.npmjs.com/package/phoenix-channels
   */
  socket: InstanceType<PhoenixSocket>
  absintheSocket: InstanceType<AbsintheSocket>
  onUpdatedAccountOrders(
    variables: {
      buyOrSell?: OrderBuyOrSell
      marketName?: string
      rangeStart?: DateTime
      rangeStop?: DateTime
      status?: OrderStatus[]
      type?: OrderType[]
    },
    handlers: SubscriptionHandlers<{
      data: {
        updatedAccountOrders: Order[]
      }
    }>
  ): void
  onUpdatedCandles(
    variables: { interval: CandleInterval; marketName: string },
    handlers: SubscriptionHandlers<{
      data: {
        updatedCandles: CandleRange[]
      }
    }>
  ): void
  onUpdatedTickers(
    handlers: SubscriptionHandlers<{
      data: {
        updatedTickers: Ticker[]
      }
    }>
  ): void
  onNewTrades(
    variables: { marketName: string },
    handlers: SubscriptionHandlers<{
      data: {
        newTrades: Trade[]
      }
    }>
  ): void
  onUpdatedOrderbook(
    variables: { marketName: string },
    handlers: SubscriptionHandlers<{
      data: {
        updatedOrderBook: OrderBook
      }
    }>
  ): void
  onAccountTrade(
    variables: { marketName: string },
    handlers: SubscriptionHandlers<{
      data: {
        newAccountTrades: Trade[]
      }
    }>
  ): void
}
