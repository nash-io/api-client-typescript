import gql from 'graphql-tag';
import { CurrencyPrice } from '../../../types';

export type CurrencyPricePartial = Pick<CurrencyPrice, 'amount'>;

export const CURRENCY_PRICE_PARTIAL_FRAGMENT = gql`
  fragment currencyPricePartialFields on CurrencyPrice {
    amount
  }
`;
