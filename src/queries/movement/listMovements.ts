import gql from 'graphql-tag';

import { MOVEMENT_FRAGMENT } from './fragments';

export const LIST_MOVEMENTS = gql`
  query listMovements($payload: ListMovementsParams!, $signature: Signature) {
    listMovements(payload: $payload, signature: $signature) {
      ...movementFields
    }
  }
  ${MOVEMENT_FRAGMENT}
`;
