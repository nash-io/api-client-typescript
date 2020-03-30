import { Blockchain } from '../types'
export function checkMandatoryParams(
  ...args: Array<Record<string, any>>
): void {
  // should iterate over all received params and check if they match with their respective Type
  const errors = []
  for (const arg of args) {
    const expectedType = arg.Type

    for (const key of Object.keys(arg)) {
      if (key === 'Type') {
        continue
      }
      const paramObj = arg[key]
      // if (typeof paramObj === 'object') {
      //   paramObj == paramObj[key]
      // }
      if (typeof paramObj === null || typeof paramObj === undefined) {
        errors.push(`${key} is missing, but required`)
      }
      if (typeof paramObj !== expectedType) {
        errors.push(`${key} must be of type ${expectedType}`)
      }
    }
  }
  if (errors.length === 0) {
    return
  }
  throw new Error(errors.join('\n'))
}

/**
 *
 * Bitcoin (34 chars starts with 1 or 3, or 42 chars starts with 1bc)
 * 1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2
 * 3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy
 *
 * Eth  (40 chars without the 0x prefix)
 * 0x931d387731bbbc988b312206c74f77d004d6b84b
 * 0x6dda190f511537b96de2dd7b9943560c1c6425b4
 * 0x931d387731bbbc988b312206c74f77d004d6b84b
 * 931d387731bbbc988b312206c74f77d004d6b84b
 *
 * neo: 34 chars, starts with uppercase A:
 * AStoGW3erfFsoJnmquGi4bXgLrc4iDCu5h
 * AbxmHkpmvWWx3owu3u9BLSeyRS4kUh7mGy
 * ATjyK5FMPke8wMehARKT8h9XTatJZWfmaN
 */

// returns null if no blockchain addresses types were matched
export const detectBlockchain = (address: string): Blockchain | null => {
  if (
    /^0x[0-9a-fA-F]{40}$/.test(address) ||
    /^[0-9a-fA-F]{40}$/.test(address)
  ) {
    return Blockchain.ETH
  }
  if (/^A[a-zA-Z0-9]{33}$/.test(address)) {
    return Blockchain.NEO
  }
  if (
    /^1[a-zA-Z0-9]{33}$/.test(address) ||
    /^3[a-zA-Z0-9]{33}$/.test(address) ||
    /^bc1[a-zA-Z0-9]{39}$/.test(address)
  ) {
    return Blockchain.BTC
  }
  return null
}
