'use strict';

// Live Rails flows: signed read-only operations against a real environment.
//
// yarn build
// node --env-file=.env integration-tests/rails/rails-flows.js
//
// Credentials (.env is gitignored):
//   NASH_API_KEY + NASH_API_SECRET  use an existing API key (never revoked here), or
//   NASH_RAILS_EMAIL + NASH_RAILS_PASSWORD  create a fresh key and revoke it at the end.
// NASH_RAILS_ONLY=1 skips client.login() (GraphQL) and injects the API-key credentials
//   directly via private Client fields (requestCredentials, mode); needs NASH_API_KEY.
// Optional: NASH_ENV (sandbox), NASH_HOST (app.arm-dev1.nash.io),
//   NASH_RAILS_API_URL (https://rails.sandbox.nash.io/api/v1)

const assert = require('assert');
const Nash = require('../../build/main');
const { decodeApiSecret } = require('../../build/main/client/requestSigning');
const getClientArgs = require('./support/client-args');

const required = name => {
  if (!process.env[name]) throw new Error(`Set ${name}`);
  return process.env[name];
};

async function run() {
  const client = new Nash.Client(...getClientArgs());
  let creator;
  let createdKeyId;

  const step = async (name, fn) => {
    const result = await fn();
    console.log(`${name}: PASS`);
    return result;
  };

  try {
    await step('public GET /openapi.json', async () => {
      const doc = await client.rails.getOpenApi();
      assert(
        doc.paths['/partner'] && doc.paths['/customers'],
        'OpenAPI missing paths'
      );
    });

    let credentials;
    if (process.env.NASH_API_KEY) {
      credentials = {
        apiKey: process.env.NASH_API_KEY,
        secret: required('NASH_API_SECRET')
      };
    } else {
      const email = required('NASH_RAILS_EMAIL');
      const password = required('NASH_RAILS_PASSWORD');
      const walletIndices = {
        neo: 1,
        eth: 1,
        btc: 1,
        polygon: 1,
        avaxc: 1,
        arbitrum: 1,
        neo3: 1
      };
      creator = new Nash.Client(...getClientArgs());
      await creator.passwordLogin({
        email,
        password,
        walletIndices,
        net: 'MainNet'
      });
      credentials = await creator.createApiKey(
        `sdk-it-${Date.now()}`,
        password,
        walletIndices,
        'MainNet'
      );
      assert(credentials, 'createApiKey failed');
      console.log('create API key with request_signing_key: PASS');
    }

    if (process.env.NASH_RAILS_ONLY) {
      assert(process.env.NASH_API_KEY, 'NASH_RAILS_ONLY requires NASH_API_KEY');
      // ponytail: relies on private fields; replace with a public API if the SDK adds one
      client.mode = Nash.ClientMode.MPC;
      client.requestCredentials = {
        apiKey: credentials.apiKey,
        requestKey: decodeApiSecret(credentials.secret).requestKey
      };
    } else {
      await client.login(credentials);
      console.log('signed GraphQL HTTP initialization: PASS');
    }

    await step('signed GET /partner', () => client.rails.getPartner());

    const keys = await step('signed GET /api-keys', () =>
      client.rails.listApiKeys()
    );
    const mine = keys.credentials.find(
      c => c.name && c.name.startsWith('sdk-it-')
    );
    if (creator) {
      assert(mine, 'new key not listed by GET /api-keys');
      createdKeyId = mine.id;
    }
    const keyId = createdKeyId || credentials.apiKey;
    await step('signed GET /api-keys/:id', async () => {
      const { credential } = await client.rails.getApiKey(keyId);
      assert.strictEqual(credential.id, keyId);
    });

    const customers = await step('signed GET /customers', () =>
      client.rails.listCustomers({ limit: 1 })
    );
    assert(
      Array.isArray(customers.items),
      'GET /customers returned no items array'
    );
    if (customers.items[0]) {
      const id = customers.items[0].id;
      await step('signed GET /customers/:id', () =>
        client.rails.getCustomer(id)
      );
      await step('signed GET /customers/:id/kyc', () =>
        client.rails.getCustomerKyc(id)
      );
      await step('signed GET /wallets (customer)', () =>
        client.rails.listWallets(id)
      );
    }

    await step('signed GET /blockchains', () => client.rails.listBlockchains());
    await step('signed GET /orders', () =>
      client.rails.listOrders({ limit: 1 })
    );
    await step('signed GET /webhooks/subscriptions', () =>
      client.rails.listWebhookSubscriptions()
    );
  } finally {
    if (createdKeyId) {
      try {
        await client.rails.revokeApiKey(createdKeyId);
        console.log('signed DELETE /api-keys/:id (cleanup): PASS');
      } catch (e) {
        console.error(
          `Cleanup failed; revoke key ${createdKeyId} manually: ${e.message}`
        );
        process.exitCode = 1;
      }
    }
    client.disconnect();
    if (creator) creator.disconnect();
  }
}

run().catch(error => {
  console.error(
    error instanceof Nash.RailsApiError
      ? `Rails HTTP ${error.status} (${error.code || 'no code'}): ${
          error.message
        }`
      : `Rails flows failed: ${
          error instanceof Error ? error.stack : String(error)
        }`
  );
  process.exitCode = 1;
});
