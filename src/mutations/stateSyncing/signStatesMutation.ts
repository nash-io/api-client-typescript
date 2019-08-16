import gql from 'graphql-tag'

import { SignStatesFields, ClientSignedStates } from './fragments'

export const SIGN_STATES_MUTATION = gql`
  mutation signStates($payload: SignStatesParams!, $signature: String!) {
    signStates(payload: $payload, signature: $signature) {
      serverSignedStates {
        message
        blockchain
      }
    }
  }
`

export interface SignStatesData {
  signStates: {
    serverSignedStates: SignStatesFields[]
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
