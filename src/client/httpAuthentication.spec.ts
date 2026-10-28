import { createHash } from 'crypto'
import { ECPair } from 'bitcoinjs-lib'
import fetch from 'node-fetch'
import {
  BIP44,
  getHKDFKeysFromPassword,
  decryptSecretKey,
  generateAPIKeys
} from '@neon-exchange/nash-protocol'
import { Client } from './client'
import { RailsApiError } from './rails'
import { authenticatedHeaders, decodeApiSecret, signRequest } from './requestSigning'

jest.mock('node-fetch', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('@neon-exchange/nash-protocol', () => ({
  ...jest.requireActual('@neon-exchange/nash-protocol'),
  getHKDFKeysFromPassword: jest.fn(),
  decryptSecretKey: jest.fn(),
  generateAPIKeys: jest.fn()
}))

const privateKey = '01cbefdb07ad492f446edf947085503c1158a5a08262b974eb445de9045bf21a'
const pair = ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex'))
const publicKey = ECPair.fromPublicKey(pair.publicKey)
const child = {
  address: 'test-address',
  client_secret_share: '01',
  public_key: pair.publicKey.toString('hex'),
  server_secret_share_encrypted: '02'
}
const secret = {
  version: 1,
  paillier_pk: { n: '11' },
  child_keys: { [BIP44.BTC]: child, [BIP44.ETH]: child, [BIP44.NEO]: child },
  payload_signing_key: '02'.repeat(32),
  payload_public_key: ECPair.fromPrivateKey(Buffer.from('02'.repeat(32), 'hex')).publicKey.toString('hex'),
  request_signing_key: privateKey
}
const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64')
// Jest replaces this library boundary with a mock; production uses the real fetch implementation.
const send = fetch as unknown as jest.Mock
interface CapturedRequest {
  method: string
  headers: Record<string, string>
  body?: string | Buffer
  redirect?: string
}
const calls = (): Array<[string, CapturedRequest]> => send.mock.calls
const client = (headers: Record<string, string> = {}) => new Client({
  host: 'localhost:4000', isLocal: true, railsApiUrl: 'http://localhost:4000/api/v1'
}, { headers })

function verify(url: string, request: CapturedRequest): boolean {
  const headers = request.headers
  const target = new URL(url)
  const body = headers['nash-content-sha256'] || (request.body ? request.body.toString() : '')
  const canonical = [headers['nash-timestamp'], request.method.toUpperCase(), target.pathname + target.search,
  headers['nash-customer-id'] || '', headers['nash-act-as'] || '', body].join('\n')
  return publicKey.verify(createHash('sha256').update(canonical).digest(), Buffer.from(headers['nash-signature'], 'hex'))
}

beforeEach(() => {
  send.mockReset()
  send.mockImplementation(async (_url: string, request: CapturedRequest) => {
    const body = typeof request.body === 'string' ? request.body : ''
    const data = body.includes('ListMarkets') ? { listMarkets: [] }
      : body.includes('ListAssetsQuery') ? { listAssets: [] }
        : { getAssetsNonces: [] }
    return { status: 200, ok: true, headers: {}, json: async () => ({ data }), text: async () => JSON.stringify({ data }) }
  })
})
afterEach(() => jest.restoreAllMocks())

it('matches the published compact signature and binds all six canonical fields', () => {
  const url = new URL('https://rails.example/api/v1/customers?limit=20')
  const signature = signRequest(pair, '1791907200', 'GET', url)
  expect(signature).toBe('478f8bb61194d6e6671c626825659061504605adce6ad9c3096d4ae0bac84a0c5d45ebe28e1f9e11405948324405ce6b727649b685ba65294ef21b2a569219e1')
  const fields = ['1791907200', 'GET', '/api/v1/customers?limit=20', '', '', '']
  fields.forEach((_, index) => {
    const changed = [...fields]
    changed[index] += 'x'
    expect(publicKey.verify(createHash('sha256').update(changed.join('\n')).digest(), Buffer.from(signature, 'hex'))).toBe(false)
  })
})

it('finalizes reserved headers case-insensitively and signs a fresh dispatch timestamp', () => {
  const clock = jest.spyOn(Date, 'now').mockReturnValue(1791907200000)
  const url = new URL('https://example.test/api/graphql')
  const headers = authenticatedHeaders({ apiKey: 'current', requestKey: pair }, 'POST', url, '{"value":"雪\\n"}', '', {
    AUTHORIZATION: 'Token stale', 'Nash-Signature': 'stale', 'NASH-CUSTOMER-ID': 'foreign', 'Nash-Content-Sha256': 'stale'
  })
  expect(headers.Authorization).toBe('Token current')
  expect(Object.keys(headers).filter(name => name.toLowerCase() === 'authorization')).toEqual(['Authorization'])
  expect(headers['nash-customer-id']).toBeUndefined()
  expect(headers['nash-content-sha256']).toBeUndefined()
  expect(verify(url.href, { method: 'POST', headers, body: '{"value":"雪\\n"}' })).toBe(true)
  clock.mockReturnValue(1791907201000)
  expect(authenticatedHeaders({ apiKey: 'current', requestKey: pair }, 'POST', url, '')['nash-timestamp']).toBe('1791907201')
})

it('rejects malformed and legacy credentials before network, disconnect, or active-session mutation', async () => {
  const sdk = client()
  await sdk.login({ apiKey: 'original', secret: encode(secret) })
  const active = sdk.apiKey
  const disconnect = jest.spyOn(sdk, 'disconnect')
  send.mockClear()
  const invalid = [undefined, null, 1, '', 'ab', 'g'.repeat(64), '0'.repeat(64), 'f'.repeat(64),
    'fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141']
  for (const requestSigningKey of invalid) {
    await expect(sdk.login({ apiKey: 'replacement', secret: encode({ ...secret, request_signing_key: requestSigningKey }) })).rejects.toThrow('Invalid API-key secret')
  }
  for (const encoded of ['not-base64', encode([]), encode(null), Buffer.from('{').toString('base64'), encode({ request_signing_key: privateKey })]) {
    await expect(sdk.login({ apiKey: 'replacement', secret: encoded })).rejects.toThrow('Invalid API-key secret')
  }
  expect(sdk.apiKey).toBe(active)
  expect(disconnect).not.toHaveBeenCalled()
  expect(send).not.toHaveBeenCalled()
  expect(decodeApiSecret(encode(secret)).requestKey.publicKey.equals(pair.publicKey)).toBe(true)
})

it('signs every first-login HTTP request while retaining the independent MPC nonce signature', async () => {
  const sdk = client({ authorization: 'Token stale', 'Nash-Signature': 'stale' })
  await sdk.login({ apiKey: 'registered', secret: encode(secret) })
  expect(calls().map(([, request]) => verify('http://localhost:4000/api/graphql', request))).toEqual([true, true, true])
  for (const [, request] of calls()) {
    expect(request.headers.Authorization).toBe('Token registered')
    expect(request.redirect).toBe('manual')
  }
  const nonceBody = calls()[2][1].body
  if (typeof nonceBody !== 'string') {
    throw new Error('nonce request must carry serialized JSON')
  }
  const nonce = JSON.parse(nonceBody)
  expect(nonce.variables.signature.publicKey).toBe(secret.payload_public_key)
  expect(nonce.variables.signature.signedDigest).toMatch(/^[0-9a-f]+$/i)
  expect(secret.payload_signing_key).not.toBe(secret.request_signing_key)
})

it('leaves anonymous and full-secret HTTP unsigned and websocket operations on their existing transport', async () => {
  const sdk = client()
  await sdk.listMarkets()
  expect(calls()[0][1].headers['nash-signature']).toBeUndefined()
  // Only the transport mode is changed here; full-secret account login is outside this signing boundary.
  const internal = sdk as unknown as { mode: string; clientOpts: { runRequestsOverWebsockets: boolean }; getAbsintheSocket: () => unknown }
  internal.mode = 'FULL_SECRET'
  await sdk.listMarkets()
  expect(calls()[1][1].headers['nash-signature']).toBeUndefined()
  internal.clientOpts.runRequestsOverWebsockets = true
  internal.getAbsintheSocket = () => { throw new Error('websocket branch reached') }
  send.mockClear()
  await expect(sdk.listMarkets()).rejects.toThrow('websocket branch reached')
  expect(send).not.toHaveBeenCalled()
})

it('signs the acting account: partner selector or customer id, never both', async () => {
  const sdk = client()
  await sdk.login({ apiKey: 'registered', secret: encode(secret) })
  send.mockClear()
  await sdk.rails.listPaymentMethods(null)
  const [partnerUrl, partnerRequest] = calls()[0]
  expect(partnerRequest.headers['nash-act-as']).toBe('partner')
  expect(partnerRequest.headers['nash-customer-id']).toBeUndefined()
  expect(verify(partnerUrl, partnerRequest)).toBe(true)
  await sdk.rails.listPaymentMethods('customer')
  const [customerUrl, customerRequest] = calls()[1]
  expect(customerRequest.headers['nash-act-as']).toBeUndefined()
  expect(customerRequest.headers['nash-customer-id']).toBe('customer')
  expect(verify(customerUrl, customerRequest)).toBe(true)
})

it('isolates concurrent customers and keeps partner filters separate from authorization', async () => {
  const sdk = client()
  await sdk.login({ apiKey: 'registered', secret: encode(secret) })
  send.mockClear()
  await Promise.all([sdk.rails.getCustomer('customer/a'), sdk.rails.getCustomer('customer/b')])
  expect(calls().map(([capturedUrl, capturedRequest]) => [new URL(capturedUrl).pathname, capturedRequest.headers['nash-customer-id'], verify(capturedUrl, capturedRequest)])).toEqual([
    ['/api/v1/customers/customer%2Fa', 'customer/a', true],
    ['/api/v1/customers/customer%2Fb', 'customer/b', true]
  ])
  await sdk.rails.listOrders({ customer_id: 'customer/a', cursor: 'a+b/雪?=&', limit: 0 })
  const [listUrl, listRequest] = calls()[2]
  expect(new URL(listUrl).searchParams.get('cursor')).toBe('a+b/雪?=&')
  expect(new URL(listUrl).searchParams.get('limit')).toBe('0')
  expect(listRequest.headers['nash-customer-id']).toBeUndefined()
  expect(verify(listUrl, listRequest)).toBe(true)
})

it('signs Unicode JSON, empty actions, and the exact buffered multipart bytes', async () => {
  const sdk = client()
  await sdk.login({ apiKey: 'registered', secret: encode(secret) })
  send.mockClear()
  await sdk.rails.createCustomer({ email: '雪\n@example.test', countryCode: 'NL' })
  await sdk.rails.cancelQuote('customer', 'quote/1')
  await sdk.rails.submitComplianceDocuments('customer', 'request', [
    { data: Buffer.from([0, 255, 13, 10]), filename: 'one.bin', contentType: 'application/octet-stream' },
    { data: Buffer.from('雪'), filename: 'two.txt', contentType: 'text/plain' }
  ])
  expect(calls().map(([url, request]) => verify(url, request))).toEqual([true, true, true])
  expect(calls()[0][1].body).toBe(JSON.stringify({ email: '雪\n@example.test', countryCode: 'NL' }))
  expect(calls()[1][1].body).toBeUndefined()
  const upload = calls()[2][1]
  const raw = upload.body as Buffer
  expect(Buffer.isBuffer(raw)).toBe(true)
  expect(upload.headers['nash-content-sha256']).toBe(createHash('sha256').update(raw).digest('hex'))
  const contentType = Object.keys(upload.headers).find(name => name.toLowerCase() === 'content-type')
  if (contentType === undefined) {
    throw new Error('multipart content type is missing')
  }
  const boundary = upload.headers[contentType].split('boundary=')[1]
  expect(raw.includes(Buffer.from('--' + boundary + '\r\n'))).toBe(true)
  expect(raw.toString().match(/name="documents\[\]"/g)).toHaveLength(2)
  expect(raw.includes(Buffer.from([0, 255, 13, 10]))).toBe(true)
})

it('retrieves OpenAPI without credentials and propagates structured, replay, and non-JSON failures', async () => {
  const sdk = client({ Authorization: 'Token stale', 'Nash-Signature': 'stale', Cookie: 'private' })
  await sdk.rails.getOpenApi()
  expect(Object.keys(calls()[0][1].headers).some(name => /authorization|nash-|cookie/i.test(name))).toBe(false)
  await expect(sdk.rails.getPartner()).rejects.toThrow()
  await sdk.login({ apiKey: 'registered', secret: encode(secret) })
  for (const code of ['partner_credential_not_allowed', 'replay_detected']) {
    send.mockImplementationOnce(async () => ({ status: 403, ok: false, text: async () => JSON.stringify({ error: { code, message: 'Rejected' } }) }))
    try {
      await sdk.rails.getPartner()
      throw new Error('expected backend rejection')
    } catch (error) {
      expect(error).toBeInstanceOf(RailsApiError)
      expect((error as RailsApiError).status).toBe(403)
      expect((error as RailsApiError).code).toBe(code)
    }
  }
  for (const text of ['upstream unavailable', '']) {
    send.mockImplementationOnce(async () => ({ status: 502, ok: false, text: async () => text }))
    await expect(sdk.rails.getPartner()).rejects.toMatchObject({ status: 502 })
  }
})

it('retains large monetary integers as strings and rejects numeric money inputs', async () => {
  const sdk = client()
  await sdk.login({ apiKey: 'registered', secret: encode(secret) })
  send.mockImplementationOnce(async () => ({
    status: 200,
    ok: true,
    text: async () =>
      '{"base":{"unit":"eur","amount":9007199254740993,"scale":2},"target":{"unit":"eth","amount":100000001,"scale":8}}'
  }))
  const estimate = await sdk.rails.createDryQuote('customer', {
    type: 'buy',
    blockchain: 'eth',
    cryptoAsset: 'eth',
    fiatAsset: 'eur'
  })
  if (estimate.base === null || estimate.target === null) {
    throw new Error('dry quote currency values are missing')
  }
  expect(estimate.base.amount).toBe('9007199254740993')
  expect(estimate.target.amount).toBe('100000001')
  send.mockImplementationOnce(async () => ({
    status: 200,
    ok: true,
    text: async () =>
      '{"quote":{"fiatAmount":9007199254740993,"cryptoAmount":100000001}}'
  }))
  const quote = await sdk.rails.getQuote('customer', 'quote')
  expect(quote.quote.fiatAmount).toBe('9007199254740993')
  expect(quote.quote.cryptoAmount).toBe('100000001')
  const uncheckedRails = sdk.rails as unknown as {
    createQuote(customerId: string, body: unknown): Promise<unknown>
  }
  await expect(uncheckedRails.createQuote('customer', {
    type: 'buy',
    blockchain: 'eth',
    cryptoAsset: 'eth',
    fiatAsset: 'eur',
    fiatAmount: 0.1
  })).rejects.toThrow('must be a decimal string')
})

it('registers fresh request public keys and exports only matching local private keys without changing MPC material', async () => {
  // These cryptographic account-creation boundaries are mocked; request-key generation remains real.
  const hkdf = getHKDFKeysFromPassword as unknown as jest.Mock
  const decrypt = decryptSecretKey as unknown as jest.Mock
  const generate = generateAPIKeys as unknown as jest.Mock
  hkdf.mockResolvedValue({ authKey: Buffer.from('01', 'hex'), encryptionKey: Buffer.from('02', 'hex') })
  decrypt.mockResolvedValue(Buffer.from('03', 'hex'))
  const { request_signing_key, ...mpc } = secret
  generate.mockResolvedValue(mpc)
  send.mockImplementation(async () => ({
    status: 200,
    json: async () => ({
      data: {
        createApiKey: {
          token: 'created',
          secrets: { encryptedSecretKey: '00', encryptedSecretKeyNonce: '00', encryptedSecretKeyTag: '00' }
        }
      }
    })
  }))
  const sdk = client()
  const first = await sdk.createApiKey('first', 'password', {})
  const second = await sdk.createApiKey('second', 'password', {})
  const firstSecret = decodeApiSecret(first.secret)
  const secondSecret = decodeApiSecret(second.secret)
  expect(firstSecret.secret.request_signing_key).not.toBe(secondSecret.secret.request_signing_key)
  expect(firstSecret.secret.request_signing_key).not.toBe(request_signing_key)
  for (const [index, exported] of [firstSecret, secondSecret].entries()) {
    const requestBody = calls()[index][1].body
    if (typeof requestBody !== 'string') {
      throw new Error('creation request must carry JSON')
    }
    const request = JSON.parse(requestBody)
    expect(request.variables.requestPublicKey).toBe(exported.requestKey.publicKey.toString('hex'))
    expect(requestBody.includes(exported.secret.request_signing_key)).toBe(false)
    const { request_signing_key: localKey, ...exportedMpc } = exported.secret
    expect(localKey).toMatch(/^[0-9a-f]{64}$/)
    expect(exportedMpc).toEqual(mpc)
  }
  expect(first.apiKey).toBe('created')
  expect(second.apiKey).toBe('created')
})
