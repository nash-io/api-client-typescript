import gql from 'graphql-tag'

export interface GraphPoint {
    time: number
    value: number
}

export const GRAPH_POINT_FRAGMENT = gql`
  fragment graphPointFields on GraphPoint {
    time
    value
  }
`