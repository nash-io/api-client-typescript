import gql from 'graphql-tag'
import { CURRENCY_ACCOUNT_VOLUME_FRAGMENT } from '../currency/fragments'
import { CurrencyAccountVolume } from '../../types'

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