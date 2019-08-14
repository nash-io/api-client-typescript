import gql from 'graphql-tag';

import { ADD_MOVEMENT_FRAGMENT } from './fragments/index';

export const ADD_MOVEMENT_MUTATION = gql`
  mutation addMovement($payload: AddMovementParams!, $signature: Signature!) {
    addMovement(payload: $payload, signature: $signature) {
      ...addMovementFields
    }
  }
  ${ADD_MOVEMENT_FRAGMENT}
`;
