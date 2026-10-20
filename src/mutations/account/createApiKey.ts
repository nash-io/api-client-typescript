import gql from 'graphql-tag'

export const CREATE_APIKEY_MUTATION = gql`
  mutation APIKeysViewCreateApiKey(
    $name: String!
    $password: String!
    $twoFa: String
    $requestPublicKey: Base16!
  ) {
    createApiKey(
      name: $name
      password: $password
      twoFa: $twoFa
      requestPublicKey: $requestPublicKey
    ) {
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
  requestPublicKey: string
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
