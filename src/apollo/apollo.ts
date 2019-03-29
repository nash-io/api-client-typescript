import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { createHttpLink } from 'apollo-link-http';
import fetch from 'node-fetch';
import { GQL_HOST_LOCAL } from '../config'

const cache = new InMemoryCache();
const link = createHttpLink({
    fetch, uri: GQL_HOST_LOCAL
})

export const client = new ApolloClient({ cache, link })