import { CryptoCurrency } from '../constants/currency'

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

export enum MarketStatus {
    INITIALIZING = 'INITIALIZING',
    OFFLINE = 'OFFLINE',
    PAUSED = 'PAUSED',
    RUNNING = 'RUNNING',
    SHUTTING_DOWN = 'SHUTTING_DOWN'
}