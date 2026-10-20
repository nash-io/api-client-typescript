import { createHash } from 'crypto'
import { ECPair } from 'bitcoinjs-lib'
import { APIKey, BIP44 } from '@neon-exchange/nash-protocol'

export type AuthenticatedApiSecret = APIKey & { request_signing_key: string }

export interface RequestCredentials {
  apiKey: string
  requestKey: ECPair.ECPairInterface
}

const reservedHeaders: Record<string, true> = {
  authorization: true,
  'nash-timestamp': true,
  'nash-signature': true,
  'nash-customer-id': true,
  'nash-content-sha256': true
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
const isString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0

/** Validate locally before replacing any session or sending initialization traffic. */
export function decodeApiSecret(encoded: string): {
  secret: AuthenticatedApiSecret
  requestKey: ECPair.ECPairInterface
} {
  const invalid = (reason: string) => new Error(`Invalid API-key secret: ${reason}`)
  if (
    typeof encoded !== 'string' ||
    encoded.length === 0 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)
  ) {
    throw invalid('expected base64-encoded JSON')
  }
  let secret: unknown
  try {
    const bytes = Buffer.from(encoded, 'base64')
    const text = bytes.toString('utf8')
    if (bytes.toString('base64') !== encoded || !Buffer.from(text, 'utf8').equals(bytes)) {
      throw invalid('expected base64-encoded UTF-8 JSON')
    }
    secret = JSON.parse(text)
  } catch {
    throw invalid('expected base64-encoded UTF-8 JSON')
  }
  if (
    !isObject(secret) ||
    typeof secret.version !== 'number' ||
    !Number.isFinite(secret.version) ||
    !isObject(secret.paillier_pk) ||
    !isString(secret.paillier_pk.n) ||
    !isObject(secret.child_keys) ||
    !isString(secret.payload_signing_key) ||
    !isString(secret.payload_public_key)
  ) {
    throw invalid('missing or malformed MPC fields')
  }
  const children = secret.child_keys
  if (
    [BIP44.BTC, BIP44.ETH, BIP44.NEO].some(path => !isObject(children[path])) ||
    Object.keys(children).some(path => {
      const child = children[path]
      return !isObject(child) ||
        !['client_secret_share', 'address', 'public_key', 'server_secret_share_encrypted']
          .every(field => isString(child[field]))
    })
  ) {
    throw invalid('missing or malformed MPC child keys')
  }
  if (typeof secret.request_signing_key !== 'string' ||
      !/^[0-9a-fA-F]{64}$/.test(secret.request_signing_key)) {
    throw invalid('request_signing_key must be a registered 32-byte hexadecimal private key; replace or re-export legacy credentials')
  }
  let requestKey: ECPair.ECPairInterface
  try {
    requestKey = ECPair.fromPrivateKey(Buffer.from(secret.request_signing_key, 'hex'))
  } catch {
    throw invalid('request_signing_key is outside the secp256k1 private scalar range')
  }
  return { secret: secret as unknown as AuthenticatedApiSecret, requestKey }
}

/** Sign the exact finalized path/query and serialized body (or multipart digest). */
export function signRequest(
  key: ECPair.ECPairInterface,
  timestamp: string,
  method: string,
  url: URL,
  customerId = '',
  body = ''
): string {
  const canonical = [timestamp, method.toUpperCase(), url.pathname + url.search, customerId, body].join('\n')
  return key.sign(createHash('sha256').update(canonical, 'utf8').digest()).toString('hex')
}

/** Reserved values are finalized after caller-header merging, regardless of casing. */
export function authenticatedHeaders(
  credentials: RequestCredentials,
  method: string,
  url: URL,
  body: string,
  customerId = '',
  headers: Record<string, string> = {},
  contentDigest?: string
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const name of Object.keys(headers)) {
    if (reservedHeaders[name.toLowerCase()] !== true) {
      result[name] = headers[name]
    }
  }
  const timestamp = Math.floor(Date.now() / 1000).toString()
  result.Authorization = `Token ${credentials.apiKey}`
  result['nash-timestamp'] = timestamp
  result['nash-signature'] = signRequest(credentials.requestKey, timestamp, method, url, customerId, body)
  if (customerId) {
    result['nash-customer-id'] = customerId
  }
  if (contentDigest !== undefined) {
    result['nash-content-sha256'] = contentDigest
  }
  return result
}
