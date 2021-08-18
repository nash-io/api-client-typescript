import gql from 'graphql-tag'

export const CREATE_APIKEY_MUTATION = gql`
  mutation APIKeysViewCreateApiKey(
    $name: String!
    $password: String!
    $twoFa: String
  ) {
    createApiKey(name: $name, password: $password, twoFa: $twoFa) {
      token
      secrets {
        encryptedSecretKey
        encryptedSecretKeyNonce
        encryptedSecretKeyTag
      }
    }
  }
`

export interface CreateApiKeyArgs {
  password: string
  name: string
  twoFa?: string
}

export interface AccountSecrets {
  readonly encryptedSecretKey?: string
  readonly encryptedSecretKeyNonce?: string
  readonly encryptedSecretKeyTag?: string
}

export interface CreateApiKeyResponse {
  createApiKey: {
    readonly secrets: AccountSecrets
    readonly token: string
  }
}

export interface CreateApiKeyResult {
  apiKey: string
  secret: string
}
