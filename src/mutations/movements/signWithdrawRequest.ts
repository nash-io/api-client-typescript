import gql from 'graphql-tag';

import { SIGN_MOVEMENT_FRAGMENT } from './fragments';

export const SIGN_WITHDRAW_REQUEST_MUTATION = gql`
  mutation signWithdrawRequest(
    $payload: SignMovementParams!
    $signature: Signature!
  ) {
    signWithdrawRequest(payload: $payload, signature: $signature) {
      ...signMovementFields
    }
  }
  ${SIGN_MOVEMENT_FRAGMENT}
`;
