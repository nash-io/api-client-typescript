import { validate, specifiedRules, isNonNullType, isListType } from 'graphql'
import { readFile } from 'fs'
import { buildSchema } from 'graphql/utilities'

import { LIST_MARKETS_QUERY } from '../queries/market/listMarkets'
import { GET_MARKET_QUERY } from '../queries/market/getMarket'
import { LIST_ACCOUNT_TRANSACTIONS } from '../queries/account/listAccountTransactions'
import {
  LIST_ACCOUNT_ORDERS,
  LIST_ACCOUNT_ORDERS_WITH_TRADES
} from '../queries/order/listAccountOrders'
import { LIST_ACCOUNT_TRADES } from '../queries/trade/listAccountTrades'
import { GET_ACCOUNT_ADDRESS } from '../queries/account/getAccountAddress'
import { LIST_ACCOUNT_BALANCES } from '../queries/account/listAccountBalances'
import { LIST_MOVEMENTS } from '../queries/movement/listMovements'
import { GET_ACCOUNT_BALANCE } from '../queries/account/getAccountBalance'
import { GET_ACCOUNT_ORDER } from '../queries/order/getAccountOrder'
import { GET_MOVEMENT } from '../queries/movement/getMovement'
import { GET_TICKER } from '../queries/market/getTicker'
import { CANCEL_ORDER_MUTATION } from '../mutations/orders/cancelOrder'
import { CANCEL_ALL_ORDERS_MUTATION } from '../mutations/orders/cancelAllOrders'
import { USER_2FA_LOGIN_MUTATION } from '../mutations/account/twoFactorLoginMutation'
import { SIGN_IN_MUTATION } from '../mutations/account/signIn'
import { ADD_KEYS_WITH_WALLETS_MUTATION } from '../mutations/account/addKeysWithWallets'
import { LIST_CANDLES } from '../queries/candlestick/listCandles'
import { LIST_TICKERS } from '../queries/market/listTickers'
import { LIST_TRADES } from '../queries/market/listTrades'
import { GET_ORDERBOOK } from '../queries/market/getOrderBook'
import { PLACE_LIMIT_ORDER_MUTATION } from '../mutations/orders/placeLimitOrder'
import { PLACE_MARKET_ORDER_MUTATION } from '../mutations/orders/placeMarketOrder'
import { PLACE_STOP_LIMIT_ORDER_MUTATION } from '../mutations/orders/placeStopLimitOrder'
import { PLACE_STOP_MARKET_ORDER_MUTATION } from '../mutations/orders/placeStopMarketOrder'
import { ADD_MOVEMENT_MUTATION } from '../mutations/movements/addMovementMutation'
import { PREPARE_MOVEMENT_MUTATION } from '../mutations/movements/prepareMovement'
import { UPDATE_MOVEMENT_MUTATION } from '../mutations/movements/updateMovement'
import { GET_ACCOUNT_PORTFOLIO } from '../queries/account/getAccountPortfolio'
import { LIST_ASSETS_QUERY } from '../queries/asset/listAsset'
import { NEW_ACCOUNT_TRADES } from '../subscriptions/newAccountTrades'
import { UPDATED_ACCOUNT_ORDERS } from '../subscriptions/updatedAccountOrders'
import { UPDATED_ORDER_BOOK } from '../subscriptions/updatedOrderBook'
import { NEW_TRADES } from '../subscriptions/newTrades'
import { UPDATED_TICKERS } from '../subscriptions/updatedTickers'
import { UPDATED_CANDLES } from '../subscriptions/updatedCandles'
import { DH_FIIL_POOL } from '../mutations/dhFillPool'
import { GET_ASSETS_NONCES_QUERY } from '../queries/nonces/getAssetsNonces'
import { GET_ORDERS_FOR_MOVEMENT_QUERY } from '../queries/movement/getOrdersForMovementQuery'
import { SYNC_STATES_MUTATION } from '../mutations/stateSyncing/syncStatesMutation'
import { SIGN_STATES_MUTATION } from '../mutations/stateSyncing/signStatesMutation'
import { COMPLETE_PAYLOAD_SIGNATURE } from '../mutations/mpc/completeSignature'
import { COMPLETE_BTC_TRANSACTION_SIGNATURES } from '../mutations/mpc/completeBTCTransacitonSignatures'
import { SEND_BLOCKCHAIN_RAW_TRANSACTION } from '../mutations/blockchain/sendBlockchainRawTransaction'

const queries = {
  LIST_ACCOUNT_TRADES,
  GET_ACCOUNT_ADDRESS,
  LIST_ACCOUNT_BALANCES,
  LIST_MOVEMENTS,
  GET_ACCOUNT_BALANCE,
  GET_ACCOUNT_ORDER,
  GET_MOVEMENT,
  GET_TICKER,
  CANCEL_ORDER_MUTATION,
  CANCEL_ALL_ORDERS_MUTATION,
  USER_2FA_LOGIN_MUTATION,
  SIGN_IN_MUTATION,
  ADD_KEYS_WITH_WALLETS_MUTATION,
  LIST_CANDLES,
  LIST_TICKERS,
  LIST_TRADES,
  GET_ORDERBOOK,
  PLACE_LIMIT_ORDER_MUTATION,
  PLACE_MARKET_ORDER_MUTATION,
  PLACE_STOP_LIMIT_ORDER_MUTATION,
  PLACE_STOP_MARKET_ORDER_MUTATION,
  ADD_MOVEMENT_MUTATION,
  PREPARE_MOVEMENT_MUTATION,
  UPDATE_MOVEMENT_MUTATION,
  GET_ACCOUNT_PORTFOLIO,
  LIST_ASSETS_QUERY,
  NEW_ACCOUNT_TRADES,
  UPDATED_ACCOUNT_ORDERS,
  UPDATED_ORDER_BOOK,
  NEW_TRADES,
  UPDATED_TICKERS,
  UPDATED_CANDLES,
  DH_FIIL_POOL,
  GET_ASSETS_NONCES_QUERY,
  GET_ORDERS_FOR_MOVEMENT_QUERY,
  SYNC_STATES_MUTATION,
  SIGN_STATES_MUTATION,
  COMPLETE_PAYLOAD_SIGNATURE,
  COMPLETE_BTC_TRANSACTION_SIGNATURES,
  SEND_BLOCKCHAIN_RAW_TRANSACTION,
  LIST_MARKETS_QUERY,
  GET_MARKET_QUERY,
  LIST_ACCOUNT_TRANSACTIONS,
  LIST_ACCOUNT_ORDERS,
  LIST_ACCOUNT_ORDERS_WITH_TRADES
}

const knownFragments = new Map<string, any>()

const collectFragments = ast => {
  ast.definitions.forEach(def => {
    if (def.kind === 'FragmentDefinition') {
      knownFragments.set(def.name.value, def)
    }
  })
}
async function run() {
  const src = await new Promise<string>((resolve, reject) =>
    readFile('./schema.graphql', 'utf-8', (err, buff) => {
      if (err) {
        reject(err)
      } else {
        resolve(buff)
      }
    })
  )

  const schema = buildSchema(src)
  const queryType = schema.getQueryType()
  const mutationType = schema.getMutationType()
  const subscriptionType = schema.getSubscriptionType()
  const baseTypes = {
    ID: 'string',
    UUID4: 'string',
    Int: 'number',
    Float: 'number',
    MarketName: 'string',
    Base16: 'string',
    CurrencyNumber: 'string',
    PaginationCursor: 'string',
    CurrencySymbol: 'string',
    DateTime: 'string',
    Boolean: 'boolean',
    Json: 'object',
    String: 'string',
    Date: 'string',
    NaiveDateTime: 'string'
  }

  const mapTypeName = name => {
    if (baseTypes[name]) {
      return baseTypes[name]
    }
    const t = schema.getType(name)
    if (t) {
      if (t.astNode && t.astNode.kind === 'EnumTypeDefinition') {
        return name
      }
      if (t.astNode && t.astNode.kind === 'InputValueDefinition') {
        return name
      }
      if (t.astNode && t.astNode.kind === 'InputObjectTypeDefinition') {
        return name
      }
      throw new Error('Unknown kind ' + name)
    }

    throw new Error('Invalid type ' + name)
  }

  const getTypeName = (type, notNull = false) => {
    if (type.kind === 'ListType') {
      if (notNull) {
        return 'Array<' + getTypeName(type.type) + '>'
      }
      return 'GQLNullable<Array<' + getTypeName(type.type) + '>>'
    }
    if (type.kind === 'NonNullType') {
      return getTypeName(type.type, true)
    }
    if (type.kind === 'NamedType') {
      if (notNull) {
        return mapTypeName(type.name.value || type.name)
      }
      return 'GQLNullable<' + mapTypeName(type.name.value || type.name) + '>'
    }
    throw new Error('Fail')
  }

  // Walks a query
  // Queries consist of an OperationDefinition query/mutation
  // an initial SelectionSet, the '{ fieldA, fieldB, ... }'
  // then either fields [aliasA]: FieldA
  // or a recursive selectionSet.
  //
  // Fields or Selections may be nonNull / arrays, but never both.
  // Null types for arrays are just empty arrays in gql.
  function walkSelectionSet(
    schemaType,
    node,
    indent = '  ',
    printTypename = true
  ) {
    switch (node.kind) {
      case 'FragmentSpread':
        const fragmentName = node.name.value
        if (!knownFragments.has(fragmentName)) {
          throw new Error(
            "Cannot spread fragment '" +
              fragmentName +
              "', fragment not defined"
          )
        }
        const fragmentDef = knownFragments.get(fragmentName)
        const fragmentType = fragmentDef.typeCondition.name.value
        const type = schema.getType(fragmentType)
        walkSelectionSet(type, fragmentDef.selectionSet, indent, false)
        break
      case 'SelectionSet':
        const inlineQueries = node.selections.filter(
          sel => sel.kind === 'InlineFragment'
        )
        const inlineFragments = {}
        inlineQueries.forEach(s => {
          inlineFragments[s.typeCondition.name.value] =
            inlineFragments[s.typeCondition.name.value] || []
          inlineFragments[s.typeCondition.name.value].push(s)
        })
        const baseFields = node.selections.filter(
          sel =>
            sel.kind !== 'InlineFragment' ||
            (sel.kind === 'Field' &&
              sel.name.value === '__typename' &&
              !sel.name.alias)
        )

        const fragments = Object.keys(inlineFragments)
        if (
          baseFields.length === 0 &&
          fragments.length === 0 &&
          printTypename
        ) {
          // console.log(indent + '__typename?: string')
        }
        if (baseFields.length !== 0 && fragments.length === 0) {
          // if (printTypename) {
          //   console.log(indent + '__typename?: string')
          // }
          node.selections.forEach(n => walkSelectionSet(schemaType, n, indent))
          return
        }

        fragments.forEach((typeName, i) => {
          const ty = schema.getType(typeName)
          if (i !== 0) {
            console.log(indent + '} | {')
          }
          console.log(indent + "  __typename: '" + typeName + "'")
          baseFields.forEach(n =>
            walkSelectionSet(schemaType, n, indent + '  ', false)
          )
          inlineFragments[typeName].forEach(fragment => {
            const { selectionSet } = fragment
            walkSelectionSet(ty, selectionSet, indent + '  ', false)
          })
        })

        break
      case 'Field': {
        const { name, alias, selectionSet } = node
        const fieldName = name.value
        const field = schemaType.getFields()[fieldName]
        let fieldType = field.type
        const aliasName = alias ? alias.value : fieldName

        const prefix = []
        while (true) {
          if (
            isNonNullType(fieldType) ||
            prefix[prefix.length - 1] === 'Array<'
          ) {
            fieldType = fieldType.ofType
          } else {
            prefix.push('GQLNullable<')
          }
          if (isListType(fieldType)) {
            prefix.push('Array<')
            fieldType = fieldType.ofType
          }
          if (fieldType.ofType == null) {
            break
          }
        }
        const prefixStr = prefix.join('')
        const postfixStr = '>'.repeat(prefix.length)

        // No furtherSelectionSets means we are at a leaf node / field
        if (!selectionSet) {
          console.log(
            indent +
              aliasName +
              ': ' +
              prefixStr +
              mapTypeName(fieldType) +
              postfixStr
          )
        } else {
          console.log(indent + aliasName + ': ' + prefixStr + '{')
          walkSelectionSet(fieldType, selectionSet, indent + '  ')
          console.log(indent + '}' + postfixStr)
        }
      }
    }
  }

  function generateInterfaces(document) {
    const root = document.definitions.find(
      def => def.kind === 'OperationDefinition'
    )
    if (!root) {
      return
    }

    const { name, operation, variableDefinitions, selectionSet } = root
    const nameStr = name.value
    if (variableDefinitions.length !== 0) {
      console.log(`export interface ${nameStr}Args {`)
      variableDefinitions.map(({ variable, type }) => {
        console.log('  ' + variable.name.value + ':' + getTypeName(type))
      })
      console.log('}')
    }
    console.log(`export interface ${nameStr}Result {`)
    walkSelectionSet(
      operation === 'query'
        ? queryType
        : operation === 'subscription'
        ? subscriptionType
        : mutationType,
      selectionSet
    )
    console.log('}')
  }

  let anyFailed = false
  Object.keys(queries).forEach(name => {
    const validated = validate(schema, queries[name], specifiedRules)
    if (validated.length !== 0) {
      console.error(name + ' failed')
      console.error(validated)
      anyFailed = true
    }
  })
  if (anyFailed) {
    return
  }
  console.log('/* tslint:disable */')
  console.log('type GQLNullable<A> = A | null | undefined')
  Object.values(schema.getTypeMap()).forEach((node: any) => {
    if (!node.astNode || node.astNode.kind !== 'EnumTypeDefinition') {
      return
    }
    console.log('export enum ' + node.name + ' {')
    node.getValues().forEach(enumValue => {
      console.log('  ' + enumValue.name + ' = "' + enumValue.name + '" ,')
    })
    console.log('}')
  })
  Object.values(schema.getTypeMap()).forEach((node: any) => {
    if (!node.astNode || node.astNode.kind !== 'InputObjectTypeDefinition') {
      return
    }
    console.log('export interface ' + node.name + ' {')
    Object.values(node.getFields()).forEach((field: any) => {
      if (field.astNode.type.kind === 'NonNullType') {
        console.log('  ' + field.name + ': ' + getTypeName(field.astNode.type))
      } else {
        console.log('  ' + field.name + '?: ' + getTypeName(field.astNode.type))
      }
    })
    console.log('}')
  })
  if (process.env.GENERATE_TYPES) {
    Object.keys(queries).forEach(name => {
      const ast = queries[name]
      collectFragments(ast)
    })
    Object.keys(queries).forEach(name => {
      const ast = queries[name]
      generateInterfaces(ast)
    })
  }
}
run()
