import gql from 'graphql-tag'
import { CryptoCurrency } from '../../../constants/currency'
import keyBy from 'lodash/fp/keyBy'

export enum MarketStatus {
    INITIALIZING = 'INITIALIZING',
    OFFLINE = 'OFFLINE',
    PAUSED = 'PAUSED',
    RUNNING = 'RUNNING',
    SHUTTING_DOWN = 'SHUTTING_DOWN'
}

export interface Market {
    aUnit: CryptoCurrency
    aUnitPrecision: number
    bUnit: CryptoCurrency
    bUnitPrecision: number
    minTickSize: string
    minTradeSize: string
    name: string
    status: MarketStatus
}

export const getMarketNamesMap = (markets: Market[]): Record<string, Market> =>
    keyBy('name', markets)

export const getMarketCurrencies = (markets: Market[]) =>
    Object.keys(
        markets.reduce((acc, market) => {
            acc[market.aUnit] = true
            acc[market.bUnit] = true
            return acc
        }, {})
    ) as CryptoCurrency[]

export const MARKET_FRAGMENT = gql`
  fragment marketFields on Market {
    aUnit
    aUnitPrecision
    bUnit
    bUnitPrecision
    minTickSize
    minTradeSize
    name
    status
  }
`