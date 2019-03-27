import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { createHttpLink } from 'apollo-link-http';
import fetch from 'node-fetch';

const cache = new InMemoryCache();
const link = createHttpLink({
    fetch, uri: 'http://localhost:4000/api/graphql/explore'
})

export const client = new ApolloClient({ cache, link })