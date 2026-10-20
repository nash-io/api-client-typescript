'use strict'

// Read-only live check. Build first, and use a fresh API key whose full secret
// includes the registered request_signing_key. No credential files are read.
//
// yarn build
// NASH_ENV=dev1 \
// NASH_RAILS_API_URL=https://rails.sandbox.nash.io/rails/api/v1 \
// NASH_API_KEY=<key> \
// NASH_API_SECRET=<full-secret> \
// node integration-tests/rails-api-smoke.js
// Optional: NASH_TEST_CUSTOMER_ID=<owned-customer-id> checks a customer-scoped GET.

const assert = require('assert')
const Nash = require('../build/main')

function required(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Set ${name} before running this smoke check`)
  return value
}

async function run() {
  let client

  try {
    const envName = required('NASH_ENV')
    const environment = Nash.EnvironmentConfiguration[envName]
    if (!environment) {
      throw new Error(`Unknown NASH_ENV '${envName}'`)
    }

    const railsApiUrl = required('NASH_RAILS_API_URL')
    const apiKey = required('NASH_API_KEY')
    const secret = required('NASH_API_SECRET')

    client = new Nash.Client(
      { ...environment, railsApiUrl },
      { runRequestsOverWebsockets: false }
    )

    const openApi = await client.rails.getOpenApi()
    const operations = Object.entries(openApi.paths || {}).flatMap(
      ([path, methods]) =>
        Object.keys(methods)
          .filter(method => method.toLowerCase() !== 'parameters')
          .map(method => `${method.toUpperCase()} ${path}`)
    )
    assert(operations.includes('GET /partner'), 'OpenAPI is missing GET /partner')
    assert(operations.includes('GET /customers'), 'OpenAPI is missing GET /customers')
    console.log(`Public Rails OpenAPI: PASS (${operations.length} operations)`)

    // login() initializes the authenticated GraphQL HTTP client with read-only
    // market, asset, and nonce requests; it does not create an order or movement.
    await client.login({ apiKey, secret })
    console.log('Signed GraphQL HTTP initialization: PASS')

    await client.rails.getPartner()
    console.log('Signed Rails GET /partner: PASS')

    const customers = await client.rails.listCustomers({ limit: 1 })
    assert(Array.isArray(customers.items), 'GET /customers returned no items array')
    console.log(`Signed Rails GET /customers: PASS (${customers.items.length} item(s))`)

    if (process.env.NASH_TEST_CUSTOMER_ID) {
      await client.rails.getCustomer(process.env.NASH_TEST_CUSTOMER_ID)
      console.log('Signed customer-scoped GET /customers/:id: PASS')
    }
  } finally {
    if (client) client.disconnect()
  }
}

run().catch(error => {
  if (error instanceof Nash.RailsApiError) {
    console.error(`Live API smoke failed: Rails HTTP ${error.status} (${error.code || 'no code'})`)
  } else {
    console.error(`Live API smoke failed: ${error instanceof Error ? error.message : String(error)}`)
  }
  process.exitCode = 1
})
