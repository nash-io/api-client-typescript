import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { createHttpLink } from 'apollo-link-http';
import fetch from 'node-fetch';
import { GQL_URL } from '../config'

const cache = new InMemoryCache();
const link = createHttpLink({
    fetch, uri: GQL_URL
})

export const client = new ApolloClient({ cache, link })