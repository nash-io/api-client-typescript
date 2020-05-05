import gql from 'graphql-tag'

export const ADD_KEYS_WITH_WALLETS_MUTATION = gql`
  mutation addKeysWithWallets(
    $encryptedSecretKey: String!
    $encryptedSecretKeyNonce: String!
    $encryptedSecretKeyTag: String!
    $signaturePublicKey: Base16!
    $wallets: [WalletInput]
  ) {
    addKeysWithWallets(
      encryptedSecretKey: $encryptedSecretKey
      encryptedSecretKeyNonce: $encryptedSecretKeyNonce
      encryptedSecretKeyTag: $encryptedSecretKeyTag
      signaturePublicKey: $signaturePublicKey
      wallets: $wallets
    ) {
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
  }
`

interface WalletInput {
  address: string
  blockchain: string
  chainIndex: number
  publicKey: string
}

export interface AddKeysArgs {
  encryptedSecretKey: string
  encryptedSecretKeyNonce: string
  encryptedSecretKeyTag: string
  signaturePublicKey: string
  wallets: WalletInput[]
}
export interface AddKeysResult {
  addKeysWithWallets: {
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
    wallets: {
      address: string
      blockchain: string
      chainIndex: number
      publicKey: string
    }
  }
}
