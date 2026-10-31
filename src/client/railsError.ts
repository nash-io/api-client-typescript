export class RailsApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly backendMessage?: string
  readonly details?: unknown
  readonly reason?: string

  constructor(
    status: number,
    code?: string,
    backendMessage?: string,
    details?: unknown,
    reason?: string
  ) {
    super(`Rails API request failed with HTTP status ${status}`)
    this.name = 'RailsApiError'
    this.status = status
    this.code = code
    this.backendMessage = backendMessage
    this.details = details
    this.reason = reason
    Object.setPrototypeOf(this, RailsApiError.prototype)
  }
}
