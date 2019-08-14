import gql from 'graphql-tag';

import { ASSET_FRAGMENT } from '../../asset/fragments';

export const MARKET_FRAGMENT = gql`
  fragment marketFields on Market {
    aUnit
    aUnitPrecision
    bUnit
    bUnitPrecision
    minTickSize
    minTradeSize
    minTradeSizeB
    minTradeIncrement
    minTradeIncrementB
    name
    status
  }
  ${ASSET_FRAGMENT}
`;
