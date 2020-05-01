import { print } from 'graphql/language/printer'
const previousPrintResults = new Map<any, string>()

// Print will instantiate a new visitor every time. Lets cache previously printed queries.
export const gqlToString = (ast: any): string => {
  if (previousPrintResults.has(ast)) {
    return previousPrintResults.get(ast)
  }
  const str = print(ast) as string
  previousPrintResults.set(ast, str)
  return str
}
