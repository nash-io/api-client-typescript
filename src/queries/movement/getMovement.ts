import gql from 'graphql-tag';

import { MOVEMENT_FRAGMENT } from './fragments';

export const GET_MOVEMENT = gql`
  query getMovement($payload: GetMovementParams!, $signature: Signature) {
    getMovement(payload: $payload, signature: $signature) {
      ...movementFields
    }
  }
  ${MOVEMENT_FRAGMENT}
`;
