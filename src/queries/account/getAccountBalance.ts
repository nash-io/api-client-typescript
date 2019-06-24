import gql from 'graphql-tag';

import { ACCOUNT_BALANCE_FRAGMENT } from './fragments';

export const GET_ACCOUNT_BALANCE = gql`
  query getAccountBalance(
    $payload: GetAccountBalanceParams!
    $signature: Signature
  ) {
    getAccountBalance(payload: $payload, signature: $signature)
      @connection(key: "getAccountBalance") {
      ...accountBalanceFields
    }
  }
  ${ACCOUNT_BALANCE_FRAGMENT}
`;
