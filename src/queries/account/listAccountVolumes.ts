import gql from 'graphql-tag'

import { CURRENCY_ACCOUNT_VOLUME_FRAGMENT } from '../currency/fragments'

export const LIST_ACCOUNT_VOLUMES = gql`
  query listAccountVolumes($payload: ListAccountVolumesParams!) {
    listAccountVolumes(payload: $payload) {
      volumes {
        ...currencyAccountVolumeFields
      }
    }
  }
  ${CURRENCY_ACCOUNT_VOLUME_FRAGMENT}
`
