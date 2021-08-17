import gql from 'graphql-tag'

export const GENERATE_PALLIER_PROOF_QUERY = gql`
  query ApiKeysViewGenerateProof {
    getPaillierProof {
      correctKeyProof {
        sigmaVec
      }
      paillierPk {
        n
      }
    }
  }
`

export interface PaillierPk {
  readonly n: string[]
}

export interface CorrectKeyProof {
  readonly sigmaVec: string[]
}

export interface PaillierProof {
  readonly correctKeyProof: CorrectKeyProof
  readonly paillierPk: PaillierPk
}
