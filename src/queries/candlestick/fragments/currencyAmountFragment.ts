import gql from 'graphql-tag';
import { CurrencyAmount } from '../../../types';

export type CurrencyAmountPartial = Pick<CurrencyAmount, 'amount'>;

export const CURRENCY_AMOUNT_PARTIAL_FRAGMENT = gql`
  fragment currencyAmountPartialFields on CurrencyAmount {
    amount
  }
`;
