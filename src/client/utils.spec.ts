import { checkMandatoryParams } from './utils'

describe('checkMandatoryParams', () => {
  it('should return an error when trying to call a function without mandatory params', () => {
    const email = undefined
    const password = undefined
    expect(() =>
      checkMandatoryParams({
        email,
        password,
        Type: 'string'
      })
    ).toThrow()
  })
})
