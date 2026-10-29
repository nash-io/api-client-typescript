'use strict';

// Read-only live check. Build first, and use a fresh API key whose full secret
// includes the registered request_signing_key. No credential files are read.
//
// yarn build
// NASH_ENV=dev1 \
// NASH_RAILS_API_URL=https://rails.sandbox.nash.io/api/v1 \
// NASH_API_KEY=<key> \
// NASH_API_SECRET=<full-secret> \
// node integration-tests/rails/rails-api-smoke.js
// Optional: NASH_TEST_CUSTOMER_ID=<owned-customer-id> checks a customer-scoped GET.
// Optional: NASH_ENV defaults to sandbox.
// Optional: NASH_RAILS_ONLY=1 skips client.login() (GraphQL) and signs Rails requests only.

const assert = require('assert');
const Nash = require('../../build/main');
const { decodeApiSecret } = require('../../build/main/client/requestSigning');
const getClientArgs = require('./support/client-args');

const context = {
  step: 'configuration',
  environment: process.env.NASH_ENV || 'sandbox'
};

function setStep(step, endpoint) {
  context.step = step;
  const url = new URL(endpoint);
  // origin excludes URL credentials; omit query parameters from diagnostics.
  context.endpoint = url.origin + url.pathname;
}

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name} before running this smoke check`);
  return value;
}

async function run() {
  let client;

  try {
    const apiKey = required('NASH_API_KEY');
    const secret = required('NASH_API_SECRET');

    const [config, options] = getClientArgs();
    client = new Nash.Client(config, options);
    const railsUrl = config.railsApiUrl.replace(/\/+$/, '');

    setStep('public Rails OpenAPI', `${railsUrl}/openapi.json`);
    const openApi = await client.rails.getOpenApi();
    const operations = Object.entries(openApi.paths || {}).flatMap(
      ([path, methods]) =>
        Object.keys(methods)
          .filter(method => method.toLowerCase() !== 'parameters')
          .map(method => `${method.toUpperCase()} ${path}`)
    );
    assert(
      operations.includes('GET /partner'),
      'OpenAPI is missing GET /partner'
    );
    assert(
      operations.includes('GET /customers'),
      'OpenAPI is missing GET /customers'
    );
    console.log(`Public Rails OpenAPI: PASS (${operations.length} operations)`);

    if (process.env.NASH_RAILS_ONLY === '1') {
      // ponytail: private fields match rails-flows.js; use public Rails-only login if added.
      client.mode = Nash.ClientMode.MPC;
      client.requestCredentials = {
        apiKey,
        requestKey: decodeApiSecret(secret).requestKey
      };
      console.log('Signed GraphQL HTTP initialization: SKIPPED (NASH_RAILS_ONLY=1)');
    } else {
      // login() initializes the authenticated GraphQL HTTP client with read-only
      // market, asset, and nonce requests; it does not create an order or movement.
      setStep(
        'signed GraphQL initialization (client.login)',
        `${config.isLocal ? 'http' : 'https'}://${config.host}/api/graphql`
      );
      await client.login({ apiKey, secret });
      console.log('Signed GraphQL HTTP initialization: PASS');
    }

    setStep('signed Rails partner read', `${railsUrl}/partner`);
    await client.rails.getPartner();
    console.log('Signed Rails GET /partner: PASS');

    setStep('signed Rails customer directory read', `${railsUrl}/customers`);
    const customers = await client.rails.listCustomers({ limit: 1 });
    assert(
      Array.isArray(customers.items),
      'GET /customers returned no items array'
    );
    console.log(
      `Signed Rails GET /customers: PASS (${customers.items.length} item(s))`
    );

    if (process.env.NASH_TEST_CUSTOMER_ID) {
      setStep('signed Rails customer read', `${railsUrl}/customers/:customer_id`);
      await client.rails.getCustomer(process.env.NASH_TEST_CUSTOMER_ID);
      console.log('Signed customer-scoped GET /customers/:id: PASS');
    }
  } finally {
    if (client) client.disconnect();
  }
}

run().catch(error => {
  const details = {
    ...context,
    message: error instanceof Error ? error.message : String(error)
  };
  if (error instanceof Nash.RailsApiError) {
    details.httpStatus = error.status;
    details.code = error.code;
    details.backendMessage = error.backendMessage;
  }
  if (error && Array.isArray(error.graphQLErrors)) {
    details.graphQLErrors = error.graphQLErrors.filter(Boolean).map(item => ({
      message: item.message,
      path: item.path,
      code: item.extensions && item.extensions.code
    }));
  }
  if (
    context.step === 'signed GraphQL initialization (client.login)' &&
    /unauthorized|forbidden|status40[13]/i.test(details.message)
  ) {
    details.hint =
      'GraphQL rejected API-key initialization before any authenticated Rails check. ' +
      'Verify NASH_HOST and NASH_ENV match the credential deployment; check key expiry/revocation ' +
      'and that the secret contains the registered request_signing_key. Public OpenAPI success does not validate authentication.';
  }
  let diagnostics = JSON.stringify(details, null, 2);
  for (const name of ['NASH_API_KEY', 'NASH_API_SECRET']) {
    const value = process.env[name];
    if (value) diagnostics = diagnostics.split(value).join('[REDACTED]');
  }
  console.error('Live API smoke failed:', diagnostics);
  process.exitCode = 1;
});
