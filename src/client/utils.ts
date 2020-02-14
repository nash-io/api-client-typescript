import { Result } from '../types'

export function checkMandatoryParams<T>(
  ...args: Array<Record<string, any>>
): Result<T> {
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
    return {
      type: 'ok'
    }
  }
  return {
    type: 'error',
    message: errors.join('\n')
  }
}

export function formatPayload<T = any>(
  key: keyof T,
  { errors, data }: { errors?: Array<{ message: string }>; data: T }
): Result<T[keyof T]> {
  // ignore graphqlErrors for not found data
  if (errors) {
    return {
      type: 'error',
      message: errors[0].message
    }
  }
  const payload = data && data[key]
  return {
    type: 'ok',
    data: payload
  }
}
