import gql from 'graphql-tag';

import { SIGN_MOVEMENT_FRAGMENT } from './fragments';

export const SIGN_DEPOSIT_REQUEST_MUTATION = gql`
  mutation signDepositRequest(
    $payload: SignMovementParams!
    $signature: Signature!
  ) {
    signDepositRequest(payload: $payload, signature: $signature) {
      ...signMovementFields
    }
  }
  ${SIGN_MOVEMENT_FRAGMENT}
`;
