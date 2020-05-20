import gql from 'graphql-tag'

import { SignStatesFields } from './fragments'

export const SYNC_STATES_MUTATION = gql`
  mutation syncStates($payload: SyncStatesParams!, $signature: Signature!) {
    syncStates(payload: $payload, signature: $signature) {
      result
    }
  }
`

export interface SyncStatesData {
  syncStates: {
    result: string
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
