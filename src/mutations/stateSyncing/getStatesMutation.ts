import gql from 'graphql-tag'

import { ClientSignableStates, States } from './fragments'

export const GET_STATES_MUTATION = gql`
  mutation getStates($payload: GetStatesParams!, $signature: String!) {
    getStates(payload: $payload, signature: $signature) {
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
    }
  }
`

export interface GetStatesData {
  getStates: {
    states: States
    recycledOrders: ClientSignableStates
  }
}

export interface GetStatesVariables {
  payload: {
    timestamp: number
  }
  publicKey: string
  signature: string
}
