import gql from 'graphql-tag'

import { CURRENCY_ACCOUNT_VOLUME_FRAGMENT } from '../currency/fragments'

export const LIST_ACCOUNT_VOLUMES = gql`
  query listAccountVolumes(
    $payload: ListAccountVolumesParams!
    $signature: Signature!
  ) {
    listAccountVolumes(payload: $payload, signature: $signature) {
      volumes {
        ...currencyAccountVolumeFields
      }
    }
  }
  ${CURRENCY_ACCOUNT_VOLUME_FRAGMENT}
`
