import gql from 'graphql-tag'

import {
  SignStatesFields,
  States,
  ClientSignedStates,
  ClientSignableStates
} from './fragments'

export const SIGN_STATES_MUTATION = gql`
  mutation signStates($payload: SignStatesParams!, $signature: Signature!) {
    signStates(payload: $payload, signature: $signature) {
      states {
        message
        blockchain
        nonce
        address
        balance {
          amount
          currency
        }
      }
      recycledOrders {
        message
        blockchain
      }
      serverSignedStates {
        message
        blockchain
      }
    }
  }
`

export interface GetStatesData {
  recycledOrders: ClientSignableStates
  states: States
  serverSignedStates: SignStatesFields[]
}

export interface GetStatesVariables {
  payload: {
    timestamp: number
  }
  publicKey: string
  signature: string
}

export interface SignStatesData {
  signStates: {
    serverSignedStates: SignStatesFields[]
    states: States
    recycledOrders: SignStatesFields[]
  }
}

export interface SignStatesVariables {
  payload: {
    timestamp: number
    clientSignedStates: ClientSignedStates
    signedRecycledOrders: ClientSignedStates
  }
  publicKey: string
  signature: string
}
