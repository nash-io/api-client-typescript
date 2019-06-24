import gql from 'graphql-tag';
import { MARKET_FRAGMENT } from '../../market/fragments';
import {
  CURRENCY_AMOUNT_FRAGMENT,
  CURRENCY_PRICE_FRAGMENT
} from '../../currency/fragments';

export const ORDER_FRAGMENT = gql`
  fragment orderFields on Order {
    amount {
      ...currencyAmountFields
    }
    amountRemaining {
      ...currencyAmountFields
    }
    buyOrSell
    cancelAt
    cancellationPolicy
    id
    limitPrice {
      ...currencyPriceFields
    }
    market {
      ...marketFields
    }
    placedAt
    status
    stopPrice {
      ...currencyPriceFields
    }
    type
  }
  ${CURRENCY_PRICE_FRAGMENT}
  ${CURRENCY_AMOUNT_FRAGMENT}
  ${MARKET_FRAGMENT}
`;
