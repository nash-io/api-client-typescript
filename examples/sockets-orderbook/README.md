# Sockets orderbook

This is an example on how to use the new sockets api.

```
yarn install
node orderbook.js
```

# Running against production

To run this example against sandbox the `orderbook.js` must be edited to use a different config. Edit line 4 to the following:

```
const client = new Nash.Client(Nash.EnvironmentConfiguration.sandbox)
```
