import gql from 'graphql-tag'
import { CurrencyAmount } from '../../../queries/currency/fragments'

export interface SignStatesFields {
  message: string
  blockchain: string
}

export interface ClientSignedState extends SignStatesFields {
  publicKey: string
  signature: string
}

export type ClientSignableStates = SignStatesFields[]
export type ClientSignedStates = ClientSignedState[]

export const SIGN_STATES_FRAGMENT = gql`
  fragment signStatesFields on ServerSignedState {
    message
    blockchain
  }
`

export interface State extends ClientSignedState {
  nonce: number
  address: string
  balance: CurrencyAmount
  message: string
  blockchain: string
}

export type States = State[]
