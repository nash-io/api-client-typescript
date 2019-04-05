import gql from 'graphql-tag';
import {
  CURRENCY_AMOUNT_FRAGMENT,
  CURRENCY_PRICE_FRAGMENT
} from '../../currency/fragments';

export const ORDERBOOK_RECORD_FRAGMENT = gql`
  fragment marketOrderbookRecordFields on OrderBookRecord {
    amount {
      ...currencyAmountFields
    }
    price {
      ...currencyPriceFields
    }
  }
  ${CURRENCY_AMOUNT_FRAGMENT}
  ${CURRENCY_PRICE_FRAGMENT}
`;
