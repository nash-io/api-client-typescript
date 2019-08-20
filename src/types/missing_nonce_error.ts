export class MissingNonceError extends Error {
  payload: any

  constructor(message?: string, payload?: any) {
    // 'Error' breaks prototype chain here
    super(message)
    this.payload = payload

    Object.setPrototypeOf(this, MissingNonceError.prototype)
  }
}
