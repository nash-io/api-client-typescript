/*
  Collection of common GraphQL types. Domain specific types (e.g. markets,
  orders, etc.) should not be included here.
 */
/*
  Useful Apollo types
 */
export type SubscribeToFn = () => () => void

/*
  Common type aliases
 */
export type DateTime = string
export type PaginationCursor = string

/*
  Common types
 */
export interface Signature {
  publicKey: string
  signedDigest: string
}

export type Payload = Record<string, any>

export interface PayloadWithTimestamp extends Payload {
  timestamp: number
}

export type InputPayload = Record<string, any>

export enum Blockchain {
  NEO = 'neo',
  ETH = 'eth',
  BTC = 'btc'
}

export enum Period {
  DAY = 'DAY',
  MONTH = 'MONTH',
  SEMESTER = 'SEMESTER',
  WEEK = 'WEEK'
}
