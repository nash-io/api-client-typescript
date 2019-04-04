import gql from 'graphql-tag';

export const GRAPH_POINT_FRAGMENT = gql`
  fragment graphPointFields on GraphPoint {
    time
    value
  }
`;
