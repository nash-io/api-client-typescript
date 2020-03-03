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
