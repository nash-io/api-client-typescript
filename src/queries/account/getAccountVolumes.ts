import gql from 'graphql-tag'

export const GET_ACCOUNT_VOLUMES = gql`
  query GetAccountVolumes($payload: GetAccountVolumesParams!) {
    getAccountVolumes(payload: $payload) {
      daily {
        accountLimit {
          amount
          currency
        }

        accountSpend {
          amount
          currency
        }

        accountVolume {
          amount
          currency
        }

        exchangeVolume {
          amount
          currency
        }
      }
      makerFeeRate
      monthly {
        accountLimit {
          amount
          currency
        }

        accountSpend {
          amount
          currency
        }

        accountVolume {
          amount
          currency
        }

        exchangeVolume {
          amount
          currency
        }
      }
      takerFeeRate
      yearly {
        accountLimit {
          amount
          currency
        }

        accountSpend {
          amount
          currency
        }

        accountVolume {
          amount
          currency
        }

        exchangeVolume {
          amount
          currency
        }
      }
    }
  }
`
