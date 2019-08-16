import gql from 'graphql-tag'

import { SignStatesFields } from './fragments'

export const SYNC_STATES_MUTATION = gql`
  mutation syncStates($payload: SyncStatesParams!, $signature: String!) {
    syncStates(payload: $payload, signature: $signature) {
      result
    }
  }
`

export interface SyncStatesData {
  syncStates: {
    result: boolean
  }
}

export interface SyncStatesVariables {
  payload: {
    timestamp: number
    serverSignedStates: SignStatesFields[]
  }
  publicKey: string
  signature: string
}
