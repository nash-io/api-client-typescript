import BigNumber from 'bignumber.js'

import { CryptoCurrency } from '../constants/currency'
import { Blockchain, AssetData } from '../types'

export function prefixWith0xIfNeeded(addr: string): string {
  if (addr.startsWith('0x')) {
    return addr
  }
  return '0x' + addr
}

export function transferExternalGetAmount(
  amount: BigNumber,
  asset: AssetData,
  isMainNet: boolean
): number {
  switch (asset.blockchain) {
    case Blockchain.ETH:
      if (asset.symbol === 'eth') {
        return amount.toNumber()
      } else if (asset.symbol === CryptoCurrency.USDC) {
        // Special case for USDC since backend serves incorrect blockchain precision for USDC
        // Note: This should be fixed in the backend but do not want to update assets/prod.csv
        // At this moment due to causing un-foreseen issues with that
        const exponent = isMainNet ? 6 : 18
        return amount
          .times(new BigNumber(10).exponentiatedBy(exponent))
          .toNumber()
      } else {
        if (asset.blockchainPrecision == null) {
          throw new Error('Missing blockchainPrecision')
        }
        return amount.toNumber() * Math.pow(10, asset.blockchainPrecision)
      }

    default:
      throw new Error(
        `Invalid blockchain for getting amount: ${JSON.stringify(asset)}`
      )
  }
}
