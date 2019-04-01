import gql from 'graphql-tag'
import { CurrencyAccountVolume, CURRENCY_ACCOUNT_VOLUME_FRAGMENT } from '../currency/fragments'

export interface AccountVolume {
    thirtyDayTotalVolumePercent: number,
    volumes: CurrencyAccountVolume[]
}

export const LIST_ACCOUNT_VOLUMES = gql`
  query listAccountVolumes(
    $payload: ListAccountVolumesParams!
    $signature: Signature!
  ) {
    listAccountVolumes(payload: $payload, signature: $signature)
      @connection(key: "listAccountVolumes") {
      volumes {
        ...currencyAccountVolumeFields
      }
    }
  }
  ${CURRENCY_ACCOUNT_VOLUME_FRAGMENT}
`