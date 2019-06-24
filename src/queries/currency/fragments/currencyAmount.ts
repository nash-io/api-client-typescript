import gql from 'graphql-tag';

export const CURRENCY_AMOUNT_FRAGMENT = gql`
  fragment currencyAmountFields on CurrencyAmount {
    amount
    currency
  }
`;
