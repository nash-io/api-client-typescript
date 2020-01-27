import { formatPayload, checkMandatoryParams } from './utils'

describe('checkMandatoryParams', () => {
  it('should return an error when trying to call a function without mandatory params', done => {
    const email = undefined
    const password = undefined
    const validParams = checkMandatoryParams({
      email,
      password,
      Type: 'string'
    })
    expect(validParams).toEqual({
      type: 'error',
      message: 'email must be of type string\npassword must be of type string'
    })
    done()
  })
})

describe('formatPayload', () => {
  it('should receive { type : ok, data : providedData } object when provided a valid query result', done => {
    const result = { data: { listAssets: [] } } as undefined
    const payload = formatPayload('listAssets', result)
    expect(payload).toEqual({
      type: 'ok',
      data: []
    })
    done()
  })

  it('should receive { type : error, message : errorMessage } when provided an graphql Error', done => {
    const result = { errors: [{ message: '1234' }] } as undefined
    const payload = formatPayload('listAssets', result)
    expect(payload).toEqual({
      type: 'error',
      message: '1234'
    })
    done()
  })
})
