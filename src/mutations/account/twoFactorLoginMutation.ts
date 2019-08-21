import gql from 'graphql-tag'
import { TwoFactorLoginAccount } from 'types'

export const USER_2FA_LOGIN_MUTATION = gql`
  mutation twoFactorLogin($code: String!) {
    twoFactorLogin(twoFa: $code) {
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
    }
  }
`

export interface TwoFactorLoginResponse {
  account: TwoFactorLoginAccount
  serverEncryptionKey: string
}
