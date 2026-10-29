# api-client-typescript

Official TypeScript client for interacting with the [Nash Exchange](https://nash.io/).

- [Github repository](https://github.com/nash-io/api-client-typescript)
- [Documentation](https://nash-io.github.io/api-client-typescript)

To test your integrations, Nash provides a public sandbox environment at https://app.sandbox.nash.io.

NOTE: In sandbox, testnet funds are automatically sent to new accounts. The sandbox environment is reset every couple of days.

## Installation

Requires usage of Node 14 or greater.

```sh
yarn add @neon-exchange/api-client-typescript
```

## Getting started

To get started you need to create an API key. You can find instructions on how to do so further down in this Readme.
Remember, API Keys contain sensitive infomation, if you are using version control be careful not to store the key in the repository.

## API Compatibility

Versions 6 and above include a change to order placement logic. The previous order placement logic will no longer be compatible with the exchange, so it is highly recommended to upgrade to version 6 or higher as previous versions will be deprecated.

## Usage

```typescript
import {
  Client,
  EnvironmentConfiguration
} from '@neon-exchange/api-client-typescript';

const nash = new Client(EnvironmentConfiguration.sandbox);

const run = async () => {
  const markets = await nash.listMarkets();
  console.log(markets);
};

run();
```

Note: You can use either `EnvironmentConfiguration.production` or `EnvironmentConfiguration.sandbox`.

## Authentication

Most Nash API requests require the client to be authenticated. This is needed to sign the payloads being sent over the wire.

```typescript
import {
  Client,
  EnvironmentConfiguration,
  CryptoCurrency
} from '@neon-exchange/api-client-typescript';

const nash = new Client(EnvironmentConfiguration.sandbox);

const run = async () => {
  try {
    await nash.login(require('PATH_TO_KEY.json'));
    const balance = await nash.getAccountBalance(CryptoCurrency.NEO);
    console.log(balance);
  } catch (e) {
    console.error(e);
  }
};

run();
```

## Nash Rails API

The public `RailsClient` facade lives in `src/client/rails/client.ts` and preserves the flat `client.rails.*` API. Customers, compliance, wallets, orders, and webhooks are independent domain clients sharing the `RailsBaseClient` transport implementation; no domain inherits from another. Every domain receives the same configuration, headers, and live credential getter.

`client.rails` talks to the Rails REST service separately from GraphQL and websockets. Configure `railsApiUrl` with the complete versioned base path for the same deployment; the SDK does not infer it from the GraphQL host:

```typescript
import {
  Client,
  EnvironmentConfiguration,
  RailsApiError
} from '@neon-exchange/api-client-typescript';

const client = new Client({
  ...EnvironmentConfiguration.dev1,
  railsApiUrl: 'https://rails.sandbox.nash.io/api/v1'
});

await client.login({
  apiKey: process.env.NASH_API_KEY!,
  secret: process.env.NASH_API_SECRET!
});

const openApi = await client.rails.getOpenApi();
const customer = await client.rails.createCustomer(
  { email: 'customer@example.test', countryCode: 'NL' },
  { idempotencyKey: 'customer-create-1' }
);
await client.rails.getCustomer(customer.id);

try {
  await client.rails.getPartner();
} catch (error) {
  if (error instanceof RailsApiError) {
    console.error(
      error.status,
      error.code,
      error.backendMessage,
      error.details
    );
  }
}
```

MPC Rails requests require an API-key login and a registered `request_signing_key`. Create replacement credentials with `Client.createApiKey(...)` before migrating; its secret includes the matching key registered during creation. Existing secrets without that key are rejected before network traffic. Do not edit a legacy secret to add an arbitrary private key. Keep the new secret private and revoke the old API key separately after migration.

Rails API keys need the scopes required by each operation. `getOpenApi()` is public. Partner operations such as `getPartner()` and `listCustomers()` use partner authorization; customer-resource methods send that resource's ID in `nash-customer-id`. A `customer_id` filter on `listOrders()` is a filter, not an authorization context.

Account operations (wallet challenge and registration, bank-account verification, payment methods, quotes and their lifecycle) act for exactly one account. Pass the customer id to act for that customer (`nash-customer-id`), or `null` to act as the partner itself (`nash-act-as: partner`); the header is part of the signed request and cannot be supplied through `RailsRequestOptions.headers`.

For document uploads, call `submitComplianceDocuments(customerId, requestId, documents)` with `Buffer` data, filenames, and optional MIME types. The SDK buffers the multipart body to sign its exact bytes and SHA-256 digest. State-changing calls accept `RailsRequestOptions.idempotencyKey`, forwarded as `Idempotency-Key`; reusing the same key for the same request replays the prior result, while changing request data may be rejected by the backend. Monetary inputs and wire amounts are decimal strings, not JavaScript numbers. `RailsApiError` exposes HTTP `status`, stable `code`, `backendMessage`, and sanitized `details`; its `.message` does not echo arbitrary backend text.

Fiat-ramp `createQuote` and `createDryQuote` requests require `walletAddress`: the customer's verified external wallet on the requested blockchain. Creation binds this wallet immutably as the buy destination or sell origin. Send exactly one of `fiatAmount` and `cryptoAmount` as a decimal string. Sell requests optionally select `transferMethod: 'deposit' | 'permit'` (default `deposit`); buys must omit `transferMethod`. Confirm a buy with `confirmBuy(customerId, quoteId, {})`, and a deposit sell with `confirmSell(customerId, quoteId, { paymentMethodId })`. Neither confirmation accepts `walletAddress` or the obsolete request field `settlementAddress`.

Quote responses expose the bound `walletAddress`, `transferMethod`, and nullable `permitTransferDigest`; the separate response field `settlementAddress` remains available. For permit sells, sign the created quote's raw `permitTransferDigest` directly (no `personal_sign` prefix and no typed-JSON encoding), then supply `signatureForPermitTransfer` with the payout method on the single sell confirmation. A wallet-ownership challenge signature is not permit-transfer authorization.

### Live customer KYC integration test

Following the [customer onboarding guide](https://rails.sandbox.nash.io/dashboard/guides/customers):

```sh
yarn build
node --env-file=.env integration-tests/rails/rails-kyc.js
```

The env-file flag requires Node 20.6+; on older supported Node versions, export the variables and run `node integration-tests/rails/rails-kyc.js`. Set `NASH_API_KEY` and `NASH_API_SECRET` to sandbox partner credentials with the `customers` scope. Optional `NASH_RAILS_ONLY=1` skips GraphQL initialization using the same private-field setup as `rails-flows.js`.

The test creates a unique `sdk-kyc-*-e2e@nash.io` customer, checks initiation idempotency, submits personal information and source-of-funds answers through the SDK, and checks wizard case reuse and token renewal. It reads the authenticated partner ID using `getPartner()`, then POSTs `{partner_id, customer_id, flow: "complete_kyc_scan"}` to `NASH_E2E_SETUP_URL` (default `https://app.arm-dev1.nash.io/api/e2e/account_setup`) and polls the SDK KYC snapshot for up to two minutes, requiring `tier_1` and no outstanding onboarding steps. No wizard tokens or API secrets are logged. Customer records remain after each run; there is no customer deletion route.

The test waits for a new Unix timestamp second between steps and repeated initiations: identical requests signed within one second have identical signatures and are rejected as `replay_detected`, even when the operation itself is idempotent.

The personal-information fixture appends eight random lowercase letters independently to each first and last name. After KYC approval, the test reads every pending agreement using `getCustomerTerms(customerId)` and accepts its ID through `acceptCustomerTerms`. It uploads `integration-tests/fixtures/proof-of-address.pdf` for each outstanding proof-of-address request using `submitComplianceDocuments`. This PDF is clearly labeled synthetic sandbox data, not valid evidence; other document request types are refused by the test. Upload submission clears the customer's upload obligation, but does not prove administrator approval or removal of fiat restrictions.

After each document upload, the test verifies the request left `requirements` and appears in `pendingReviews` with the same request ID, type, request type and fiat-blocking flag, and status `pending_review`. The API uses camelCase `pendingReviews`. The final assertion requires both `requirements` and `pendingReviews` to be exactly `[]`.

After observing `pending_review`, the test POSTs `{partner_id, customer_id, flow: "approve_compliance_documents"}` to `NASH_E2E_ADMIN_URL` (default `https://admin.arm-dev1.nash.io/_admin/api/e2e/run_flow`). The latest live run passed the full flow: `tier_1`, all terms accepted, document uploaded, pending review observed, administrator approval completed, and both `requirements` and `pendingReviews` empty.

### Live fiat-ramp integration test

Following the [fiat-ramp](https://rails.sandbox.nash.io/dashboard/guides/fiat-ramp), [external-wallet](https://rails.sandbox.nash.io/dashboard/guides/wallets), and [bank-account](https://rails.sandbox.nash.io/dashboard/guides/bank-accounts) guides:

```sh
yarn build
node --env-file=.env integration-tests/rails/rails-fiat-ramp.js
```

Use sandbox partner credentials with `customers`, `wallets_and_bank_accounts`, and `fiat_ramp` scopes. The Node version, Rails-only authentication, and E2E setup/admin URL options are the same as for the KYC test above. This is a manual live integration script, not part of `yarn test`.

Each run reuses the full KYC integration flow to onboard **one fresh customer**, accept terms, and obtain compliance approval. It then generates an ephemeral ETH external wallet, signs the exact EIP-712 challenge, registers it, and verifies it appears in the customer's wallet list. It registers `NASH_NFR_IBAN` (default: the OpenAPI example `DE29100100100987654321`) and requires both the verification outcome and the listed payment method to be `approved`; pending review or ownership-proof requirements fail the test.

The same customer, verified wallet, and approved payout method are used for two independent order scenarios: buy ETH with `NASH_NFR_BUY_FIAT_AMOUNT` EUR (default `100.00`), and sell `NASH_NFR_SELL_CRYPTO_AMOUNT` ETH (default `0.05`) for EUR. Amounts are decimal strings. Each scenario binds `walletAddress` when creating its distinct `pending_user_confirmation` quote and verifies the returned wallet. The sell explicitly uses `transferMethod: 'deposit'`; both scenarios require a null permit digest. Buy confirmation sends `{}` and sell confirmation sends only `paymentMethodId`, never a wallet field. The test checks deposit instructions and the funding deadline, then re-reads the quote to require `confirmed_waiting_for_payment` and the same bound wallet. A failure in either scenario fails the command, but does not prevent the other scenario from running.

After confirmation, the test POSTs `{flow: "mark_fiat_ramp_order_as_paid", partner_id, customer_id, quote_id}` **without email** to `NASH_E2E_SETUP_URL` (default `https://app.arm-dev1.nash.io/api/e2e/account_setup`). It then polls SDK quote reads every two seconds for up to two minutes per order, accepts any required rate reconfirmation before its deadline, and requires both quote status and the matching customer-filtered order-history entry to be `completed`. Payment simulation acceptance or intermediate processing states do not pass the test; unsuccessful terminal states fail immediately.

Only the E2E endpoint simulates funding; never send real bank or crypto funds. The generated wallet key is not retained. Customer, wallet, bank-account, and quote records remain in sandbox, and created quote IDs are logged for inspection. If confirmation fails, the paid endpoint is not called for that quote.

## Nodejs usage

Using the client in node can be done like below. See also the [nodejs example](https://github.com/nash-io/api-client-typescript/tree/master/examples/nodejs).

```javascript
const Nash = require('@neon-exchange/api-client-typescript');

const client = new Nash.Client(Nash.EnvironmentConfiguration.production);

const apiKeys = {
  secret: 'your secret',
  apiKey: 'your key'
};

const run = async () => {
  try {
    await client.login(apiKeys);
  } catch (e) {
    console.log(e);
  }
};

run();
```

## Websockets

You can use websockets subscriptions like this:

```javascript

import { Client, EnvironmentConfiguration } from '@neon-exchange/api-client-typescript'

const nash = new Client(EnvironmentConfiguration.sandbox)
await nash.login(...)

// Getting the orderbook for the neo_eth marked
nash.subscriptions.onUpdatedOrderbook(
  { marketName: 'neo_eth' },
  {
    onResult: ({
      data: {
        updatedOrderBook: { bids, asks }
      }
    }) => {
      console.log(`updated bids ${bids.length}`)
      console.log(`updated asks ${asks.length}`)
    }
  }
)

// Getting the user orderobok for all markets
nash.subscriptions.onUpdatedAccountOrders(
  {},
  {
    onResult: ({
      data: {
        updatedAccountOrders
      }
    }) => {
      console.log(`Updated orders: {updatedAccountOrders.length}`)
    }
  }
)

```

## Using affiliate codes

To configure the client to use an affiliate code, you just have to supply it as a client option.

```javascript
import { Client } from '@neon-exchange/api-client-typescript'

const client = new Client(
  ...,
  {
    affiliateCode: 'YOUR_CODE',
    affiliateLabel: 'arbitragebot' // Optional label
  }
)
```

You may supply an optional affiliate label, which will be shown on the affiliate page. Label may only contain alpha numeric characters.

---

## Setting up API keys

Setting up an API key is very easy. Start by navigating to your profile page, from the profile page, click on the API Keys tab, and click on the 'Generate new key' to open a create API Key wizard.
After going through the wizard. Remember to save your API key, and store it somewhere accessible to your project.

[This video](https://youtu.be/5DQ0PCbCwkI) shows how to set up a new API Key.

## API key policies & transferring funds to external wallets

Using API keys allows users to apply policies to operations performed by the SDK. One such operation is to transfer funds to external accounts. This is done by using the transferToExternal method on the Client.
Before being allowed to send funds, addresses have to be explicitly whitelisted. Otherwise the all calls to the method will result in a permission violation.

Whitelisted addresses can be set up both before and after creating the API key. [This video](https://youtu.be/5hAa3FqknFA) shows how to whitelist two addresses for an API key.

## State signing

In order to assure your blockchain balances remain in sync with your trading balances, the client must 'sign' their state every so often before placing more orders. By default, the client will take care of this in the background for you and you will not need to worry about this.

In special cases where a user has more than one client process running at once which is placing a high volume of orders, it is advisable to take a more custom approach. To turn of auto state syncing, initialize the client like so:

```
const nash = new Client(EnvironmentConfiguration.sandbox, {autoSignState: false})
```

You will then be responsible for signing states when necessary. The current restriction is that states must be signed every 100 open orders, so the client should keep track and make sure to sign state before this limit is reached, otherwise placing an order will raise an error.

This is done using the following call:

```
const states = await client.getSignAndSyncStates()
```

If you are running a high volume of orders from different clients on the same account and having difficulty managing this process, please reach out to support and we will be glad to help with an optimal solution.
