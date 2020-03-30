import { Asset, CurrencyAccountVolume } from '../types'

export interface AccountWallet {
  address: string
  blockchain: string
  chainIndex: number
  publicKey: string
}

export interface TwoFactorLoginAccount {
  creatingAccount: boolean
  email: string
  encryptedSecretKey: string
  encryptedSecretKeyTag: string
  encryptedSecretKeyNonce: string
  id: string
  loginErrorCount: number
  twoFactor: boolean
  twoFactorErrorCount: number
  verified: boolean
  wallets: AccountWallet[]
}

export interface AccountPortfolioBalance {
  allocation: number
  asset: Asset
  fiatPrice: number
  fiatPriceChange: number
  fiatPriceChangePercent: number
  total: number
  totalFiatPrice: number
  totalFiatPriceChange: number
}

export interface AccountPortfolio {
  balances: AccountPortfolioBalance[]
  total: AccountPortfolioTotal
  graph: GraphPoint[]
}

export interface AccountVolume {
  thirtyDayTotalVolumePercent: number
  volumes: CurrencyAccountVolume[]
}

export interface AccountPortfolioTotal {
  availableAllocation: number
  availableFiatPrice: number
  inOrdersAllocation: number
  inOrdersFiatPrice: number
  inStakesAllocation: number
  inStakesFiatPrice: number
  pendingAllocation: number
  pendingFiatPrice: number
  personalAllocation: number
  personalFiatPrice: number
  totalFiatPrice: number
  totalFiatPriceChange: number
  totalFiatPriceChangePercent: number
}

export interface AcountVolume {
  placeholder: string
}

export interface GraphPoint {
  time: number
  value: number
}
