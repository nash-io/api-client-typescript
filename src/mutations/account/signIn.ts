import gql from 'graphql-tag'

export const SIGN_IN_MUTATION = gql`
  mutation signIn($email: String!, $password: String!) {
    signIn(email: $email, password: $password, duration: LONG) {
      account {
        creatingAccount
        email
        encryptedSecretKey
        encryptedSecretKeyTag
        encryptedSecretKeyNonce
        id
        loginErrorCount
        twoFactor
        twoFactorErrorCount
        verified
        wallets {
          address
          blockchain
          chainIndex
          publicKey
        }
      }
      serverEncryptionKey
      twoFaRequired
    }
  }
`

export interface SignInArgs {
  email: string
  password: string
}
export interface SignInResult {
  signIn: {
    account: {
      id: string
      email: string
      twoFactor: boolean
      creatingAccount: boolean
      verified: boolean
      encryptedSecretKey: string
      encryptedSecretKeyNonce: string
      encryptedSecretKeyTag: string
      loginErrorCount: number
      twoFactorErrorCount: string
      wallets: Array<{
        address: string
        blockchain: string
        chainIndex: number
        publicKey: string
      }>
    }
    serverEncryptionKey: string
    twoFaRequired: boolean
  }
}
