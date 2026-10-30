import AbortController from 'abort-controller'
import fetch from 'node-fetch'
import { authenticatedHeaders, RequestCredentials } from '../requestSigning'
import { RailsApiError } from '../railsError'
import { EnvironmentConfig } from '../environments'
import {
  RailsCancelTransactionRequest,
  RailsCancelTransactionResponse,
  RailsFillDhPoolRequest,
  RailsFillDhPoolResponse,
  RailsGetApiKeyResponse,
  RailsGetBlockchainFeesResponse,
  RailsGetPartnerResponse,
  RailsIterateTransactionRequest,
  RailsIterateTransactionResponse,
  RailsListApiKeysResponse,
  RailsOpenApiDocument,
  RailsPrepareTransactionRequest,
  RailsPrepareTransactionResponse,
  RailsRequestOptions,
  RailsRevokeApiKeyResponse
} from '../../types/rails'
import {
  DispatchOptions,
  RAILS_ROUTES,
  RailsOperationName,
  RailsRoute
} from './routes'



const RESERVED_HEADERS: Record<string, true> = {
  authorization: true,
  cookie: true,
  cookie2: true,
  'nash-timestamp': true,
  'nash-signature': true,
  'nash-customer-id': true,
  'nash-act-as': true,
  'nash-content-sha256': true,
  'x-api-key': true,
  'api-key': true,
  'proxy-authorization': true,
  'set-cookie': true
}

const SENSITIVE_ERROR_FIELDS: Record<string, true> = {
  authorization: true,
  body: true,
  content: true,
  document: true,
  file: true,
  secret: true,
  signature: true,
  token: true,
  apikey: true,
  requestsigningkey: true
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function sanitizeErrorDetails(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(item => sanitizeErrorDetails(item))
  }
  if (!isRecord(value)) {
    return value
  }

  const details: Record<string, unknown> = {}
  Object.keys(value).forEach(key => {
    const normalizedKey = key.toLowerCase().replace(/[^a-z]/g, '')
    if (
      SENSITIVE_ERROR_FIELDS[normalizedKey] === true ||
      normalizedKey.indexOf('authorization') !== -1 ||
      normalizedKey.indexOf('secret') !== -1 ||
      normalizedKey.indexOf('token') !== -1 ||
      normalizedKey.indexOf('signature') !== -1 ||
      normalizedKey.indexOf('document') !== -1 ||
      normalizedKey.indexOf('file') !== -1 ||
      normalizedKey.indexOf('content') !== -1 ||
      normalizedKey.indexOf('apikey') !== -1 ||
      normalizedKey.indexOf('requestsigningkey') !== -1
    ) {
      return
    }
    const safeValue = sanitizeErrorDetails(value[key])
    if (safeValue !== undefined) {
      details[key] = safeValue
    }
  })
  return details
}

function setHeader(
  headers: Record<string, string>,
  name: string,
  value: string
): void {
  const lowerName = name.toLowerCase()
  Object.keys(headers).forEach(existing => {
    if (existing.toLowerCase() === lowerName) {
      delete headers[existing]
    }
  })
  headers[name] = value
}

function removeReservedHeaders(
  headers: Record<string, string>
): Record<string, string> {
  const safeHeaders: Record<string, string> = {}
  Object.keys(headers).forEach(name => {
    if (!RESERVED_HEADERS[name.toLowerCase()]) {
      safeHeaders[name] = headers[name]
    }
  })
  return safeHeaders
}

function pathWithSegments(
  template: string,
  segments: Record<string, string> = {}
): string {
  return template.replace(/\{([^}]+)\}/g, (_match, name: string) => {
    const value = segments[name]
    if (value === undefined) {
      throw new Error(`Missing path value for ${name}`)
    }
    return encodeURIComponent(value)
  })
}

function validateMoneyInputs(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(item => validateMoneyInputs(item))
    return
  }
  if (!isRecord(value)) {
    return
  }
  Object.keys(value).forEach(key => {
    const field = value[key]
    if (
      /^(amount|cryptoAmount|fiatAmount|annualIntendedVolume|giftAmount|grossAnnualIncome)$/.test(key) &&
      field !== undefined &&
      typeof field !== 'string'
    ) {
      throw new Error(`Rails monetary input '${key}' must be a decimal string.`)
    }
    validateMoneyInputs(field)
  })
}

function parseRailsResponse(text: string, operation: RailsOperationName): unknown {
  const exactMoney = operation === 'getOpenApi'
    ? text
    : text.replace(
        /("(?:amount|cryptoAmount|fiatAmount|price(?:Low|Medium|High)|baseFeePerGas|maxFeePerGas(?:Low|Medium|High)|maxPriorityFeePerGas(?:Low|Medium|High))"\s*:\s*)(-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)(?=\s*[,}\]])/g,
        '$1"$2"'
      )
  return JSON.parse(exactMoney) as unknown
}

function addQuery(url: URL, query?: object): void {
  if (!query) {
    return
  }

  const values = query as Record<string, unknown>
  const search = new URLSearchParams()
  Object.keys(values).forEach(name => {
    const value = values[name]
    if (value === undefined || value === null) {
      return
    }
    if (
      typeof value !== 'string' &&
      typeof value !== 'number' &&
      typeof value !== 'boolean'
    ) {
      throw new Error(`Invalid query value for ${name}`)
    }
    search.append(name, String(value))
  })
  const encoded = search.toString()
  if (encoded) {
    url.search = encoded
  }
}


export class RailsBaseClient {
  constructor(
    private readonly opts: EnvironmentConfig,
    private readonly getCredentials: () => RequestCredentials | undefined,
    private readonly headers: Record<string, string> = {}
  ) {}

  getOpenApi(): Promise<RailsOpenApiDocument> {
    return this.request('getOpenApi')
  }

  getPartner(): Promise<RailsGetPartnerResponse> {
    return this.request('getPartner')
  }






  listApiKeys(): Promise<RailsListApiKeysResponse> {
    return this.request('listApiKeys')
  }

  getApiKey(apiKeyId: string): Promise<RailsGetApiKeyResponse> {
    return this.request('getApiKey', {
      segments: { api_key_id: apiKeyId }
    })
  }

  revokeApiKey(
    apiKeyId: string,
    options?: RailsRequestOptions
  ): Promise<RailsRevokeApiKeyResponse> {
    return this.request('revokeApiKey', {
      segments: { api_key_id: apiKeyId },
      options
    })
  }

  fillDhPool(
    body: RailsFillDhPoolRequest,
    options?: RailsRequestOptions
  ): Promise<RailsFillDhPoolResponse> {
    return this.request('fillDhPool', { body, options })
  }

  prepareTransaction(
    body: RailsPrepareTransactionRequest,
    options?: RailsRequestOptions
  ): Promise<RailsPrepareTransactionResponse> {
    return this.request('prepareTransaction', { body, options })
  }

  getBlockchainFees(blockchain: string): Promise<RailsGetBlockchainFeesResponse> {
    return this.request('getBlockchainFees', { query: { blockchain } })
  }

  iterateTransaction(
    body: RailsIterateTransactionRequest,
    options?: RailsRequestOptions
  ): Promise<RailsIterateTransactionResponse> {
    return this.request('iterateTransaction', { body, options })
  }

  cancelTransaction(
    body: RailsCancelTransactionRequest,
    options?: RailsRequestOptions
  ): Promise<RailsCancelTransactionResponse> {
    return this.request('cancelTransaction', { body, options })
  }

  private buildUrl(path: string, query?: object): URL {
    const base = this.opts.railsApiUrl
    if (!base) {
      throw new Error('Rails API base URL is required; configure railsApiUrl.')
    }
    if (base.indexOf('?') !== -1 || base.indexOf('#') !== -1) {
      throw new Error('Rails API base URL must not contain a query or fragment.')
    }

    let url: URL
    try {
      url = new URL(base)
    } catch {
      throw new Error('Rails API base URL must be an absolute URL.')
    }
    if (url.username || url.password) {
      throw new Error('Rails API base URL must not contain credentials.')
    }
    const loopback = /(^|\.)localhost$/.test(url.hostname) ||
      url.hostname === '127.0.0.1' || url.hostname === '[::1]'
    if (url.protocol !== 'https:' &&
        !(url.protocol === 'http:' && (this.opts.isLocal || loopback))) {
      throw new Error('Rails API base URL must use HTTPS outside local development.')
    }

    const prefix = url.pathname.replace(/\/+$/, '')
    const relativePath = path.replace(/^\/+/, '')
    url.pathname = `${prefix}/${relativePath}`
    addQuery(url, query)
    return url
  }

  protected async request<Response>(
    operation: RailsOperationName,
    args: DispatchOptions = {}
  ): Promise<Response> {
    const route = RAILS_ROUTES[operation] as RailsRoute
    const path = pathWithSegments(route.path, args.segments)
    if (
      args.body !== undefined &&
      (operation === 'createQuote' ||
        operation === 'createDryQuote' ||
        operation === 'submitSourceOfFunds')
    ) {
      validateMoneyInputs(args.body)
    }
    const url = this.buildUrl(path, args.query)
    const serializedBody =
      args.body === undefined ? undefined : JSON.stringify(args.body)
    const canonicalBody = args.contentDigest || serializedBody || ''
    const headers: Record<string, string> = { ...this.headers }
    const optionHeaders = args.options && args.options.headers
    if (optionHeaders) {
      Object.keys(optionHeaders).forEach(name => {
        setHeader(headers, name, optionHeaders[name])
      })
    }
    const idempotencyKey = args.options && args.options.idempotencyKey
    if (idempotencyKey !== undefined) {
      setHeader(headers, 'Idempotency-Key', idempotencyKey)
    }
    if (args.contentType !== undefined) {
      setHeader(headers, 'Content-Type', args.contentType)
    } else if (serializedBody !== undefined) {
      setHeader(headers, 'Content-Type', 'application/json')
    }

    let outgoingHeaders: Record<string, string>
    if (route.public) {
      outgoingHeaders = removeReservedHeaders(headers)
    } else {
      const credentials = this.getCredentials()
      if (!credentials || !credentials.apiKey || !credentials.requestKey) {
        throw new Error(
          'Rails API credentials are not initialized; sign in with an API key first.'
        )
      }
      outgoingHeaders = authenticatedHeaders(
        credentials,
        route.method,
        url,
        canonicalBody,
        args.customerId ?? '',
        headers,
        args.contentDigest,
        route.path.startsWith('/transactions/') || args.customerId === null
          ? 'partner'
          : ''
      )
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)
    try {
      const response = await fetch(url.toString(), {
        method: route.method,
        headers: outgoingHeaders,
        body: args.rawBody !== undefined ? args.rawBody : serializedBody,
        redirect: 'manual',
        signal: controller.signal
      })
      const responseText = await response.text()
      if (!response.ok) {
        throw this.createApiError(response.status, responseText)
      }
      return parseRailsResponse(responseText, operation) as Response
    } finally {
      clearTimeout(timeout)
    }
  }

  private createApiError(
    status: number,
    responseText: string
  ): RailsApiError {
    let parsed: unknown
    let parsedJson = false
    if (responseText) {
      try {
        parsed = JSON.parse(responseText) as unknown
        parsedJson = true
      } catch {
        parsed = undefined
      }
    }

    let code: string | undefined
    let reason: string | undefined
    let backendMessage: string | undefined
    if (isRecord(parsed) && isRecord(parsed.error)) {
      if (typeof parsed.error.code === 'string') {
        code = parsed.error.code
      }
      if (typeof parsed.error.message === 'string') {
        backendMessage = parsed.error.message
      }
      if (typeof parsed.error.reason === 'string') {
        reason = parsed.error.reason
      }
    }

    let details: unknown
    if (parsedJson && isRecord(parsed)) {
      details = sanitizeErrorDetails(parsed)
    } else if (!responseText) {
      details = { response: 'empty response body' }
    } else if (!parsedJson) {
      details = { response: 'non-JSON response body omitted' }
    } else {
      details = { response: 'JSON response contained no structured details' }
    }
    return new RailsApiError(status, code, backendMessage, details, reason)
  }
}
