# api-client-typescript

Official TypeScript client for interacting with [Nash Rails](https://rails.sandbox.nash.io/dashboard/guides/quickstart) and the [Nash Exchange](https://nash.io/).

- [Github repository](https://github.com/nash-io/api-client-typescript)
- [Documentation](https://nash-io.github.io/api-client-typescript/)
- [Contributing](CONTRIBUTING.md)

To test your integrations, Nash provides a public sandbox environment at [https://rails.sandbox.nash.io](https://rails.sandbox.nash.io) (Rails) and [https://app.sandbox.nash.io](https://app.sandbox.nash.io) (Exchange).

NOTE: In sandbox, testnet funds are automatically sent to new accounts. The sandbox environment is reset every couple of weeks.

## Installation

Published runtime requirement: Node >=14.3. Building this repository uses Node 24 and Yarn 1.22.22; see [Contributing](CONTRIBUTING.md).

```sh
yarn add @neon-exchange/api-client-typescript
```

## Getting started

To get started you need to create an API key. You can find instructions on how to do so further down in this Readme.
Remember, API Keys contain sensitive information, if you are using version control be careful not to store the key in the repository.

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

`client.rails` is a flat, signed REST client for the Nash Rails API (customers, compliance, wallets, quotes/orders, webhooks, API keys, transaction signing). For the internal layout see [Contributing](CONTRIBUTING.md#rails-client-layout). The `login()` shown above is the exchange flow; Rails uses an API-key login, described below.

`client.rails` talks to the Rails REST service separately from GraphQL and websockets. Configure `railsApiUrl` with the complete versioned base path for the same deployment; the SDK does not infer it from the GraphQL host:

```typescript
import {
  Client,
  EnvironmentConfiguration,
  RailsApiError
} from '@neon-exchange/api-client-typescript';

const client = new Client({
  ...EnvironmentConfiguration.sandbox,
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

MPC Rails requests require an API-key login and a registered `request_signing_key`. `Client.createApiKey(...)` creates `SIGNING`/`TRADING` keys and registers a matching request key; its secret includes that key. Rails-scoped partner credentials are created in the Nash Rails dashboard, which registers the request key for them. Existing exports without `request_signing_key` are rejected before network traffic. Do not edit a legacy secret to add an arbitrary private key. Keep new secrets private and revoke the old API key separately after migration.

Rails API keys need the scopes required by each operation. `getOpenApi()` is public. Partner operations such as `getPartner()` and `listCustomers()` use partner authorization; customer-resource methods send that resource's ID in `nash-customer-id`. A `customer_id` filter on `listOrders()` is a filter, not an authorization context.

Account operations (wallet challenge and registration, bank-account verification, payment methods, quotes and their lifecycle) act for exactly one account. Pass the customer id to act for that customer (`nash-customer-id`), or `null` to act as the partner itself (`nash-act-as: partner`); the header is part of the signed request and cannot be supplied through `RailsRequestOptions.headers`.

For document uploads, call `submitComplianceDocuments(customerId, requestId, documents)` with `Buffer` data, filenames, and optional MIME types. The SDK buffers the multipart body to sign its exact bytes and SHA-256 digest. State-changing calls accept `RailsRequestOptions.idempotencyKey`, forwarded as `Idempotency-Key`; reusing the same key for the same request replays the prior result, while changing request data may be rejected by the backend. Money is sent and returned as quantity objects whose `amount` is a decimal string (`{ amount, currency }` for fiat, `{ amount, blockchain, assetHash }` for crypto), never JavaScript numbers; the SDK rejects bare strings, numbers and numeric amounts before sending, and returns large integers as exact strings. Response and request enums use the server's UPPERCASE values (`SANDBOX`, `COMPLETED`, `TIER_1`, `ETH`), except webhook subscription requests, which take dotted lowercase event names (`quote.created`) while responses report `QUOTE_CREATED`. List methods take `cursor` and `limit` (1–20) and return `nextCursor`; pass it back as `cursor` until it is `null`. `RailsApiError` exposes HTTP `status`, stable `code`, optional `reason`, `backendMessage`, and sanitized `details`; its `.message` does not echo arbitrary backend text.

Fiat-ramp `createQuote` and `createDryQuote` requests require `walletAddress`: the customer's verified external wallet on the requested blockchain. Creation binds this wallet immutably as the buy destination or sell origin. Send exactly one of `fiatAmount` (`{ amount: '100.00', currency: 'eur' }`) and `cryptoAmount` (`{ amount: '0.1', blockchain: 'ETH', assetHash }`, with `assetHash` from `getAssetRates()`); each `amount` is a decimal string. Enums are UPPERCASE: `type: 'BUY' | 'SELL'`, `blockchain: 'ETH'`. Sell requests optionally select `transferMethod: 'DEPOSIT' | 'PERMIT'` (default `DEPOSIT`); buys must omit `transferMethod`. Confirm a buy with `confirmBuy(customerId, quoteId, {})`, and a deposit sell with `confirmSell(customerId, quoteId, { paymentMethodId })`. Neither confirmation accepts `walletAddress` or the obsolete request field `settlementAddress`.

Quote responses expose the bound `walletAddress`, `transferMethod`, and nullable `permitTransferDigest`; the separate response field `settlementAddress` remains available. For permit sells, sign the created quote's raw `permitTransferDigest` directly (no `personal_sign` prefix and no typed-JSON encoding), then supply `signatureForPermitTransfer` with the payout method on the single sell confirmation. A wallet-ownership challenge signature is not permit-transfer authorization.

### Rails integration tests

Primary command — builds the SDK and runs the Rails smoke, fiat-ramp, signed-sell, and flow scripts sequentially, stopping on the first failure (`rails-kyc.js` is not included; run it separately):

```sh
yarn integration:rails
```

To run a single script instead:

```sh
yarn build
node --env-file=.env integration-tests/rails/rails-api-smoke.js
node --env-file=.env integration-tests/rails/rails-kyc.js
node --env-file=.env integration-tests/rails/rails-fiat-ramp.js
node --env-file=.env integration-tests/rails/rails-fiat-ramp-for-partner.js
node --env-file=.env integration-tests/rails/rails-sell-nash-wallet-for-partner.js
```

The env-file flag requires Node 20.6+; on older Node versions export the variables and drop the flag. This live suite never runs as part of `yarn test`.

`.env` needs exactly two keys:

```sh
NASH_API_KEY=<partner API key credential id>
NASH_API_SECRET=<complete base64 key export, including the registered request_signing_key>
```

All scripts share `integration-tests/rails/support/client-args.js`: defaults `NASH_ENV=sandbox`, `NASH_HOST=app.arm-dev1.nash.io`, `NASH_RAILS_API_URL=https://rails.sandbox.nash.io/api/v1`, HTTP rather than websockets; unknown environments are rejected, and loopback HTTP Rails URLs do not change GraphQL's protocol. `NASH_RAILS_ONLY` defaults to `1` — scripts skip GraphQL initialization and authenticate with the request-signing key only; set `NASH_RAILS_ONLY=0` to run `client.login()`. Keep secrets server-side; they are never sent as headers or logged.

Scripts wait for a fresh Unix timestamp second before their initial partner read, including across sequential script boundaries; identical requests signed within one second are rejected as `replay_detected` even when the operation is idempotent. Run scripts sequentially when sharing an API key. Records created in sandbox remain after each run; there is no customer deletion route. Sandbox E2E endpoints: setup `NASH_E2E_SETUP_URL` (default `https://app.arm-dev1.nash.io/api/e2e/account_setup`) and compliance approval `NASH_E2E_ADMIN_URL` (default `https://admin.arm-dev1.nash.io/_admin/api/e2e/run_flow`). Only these endpoints simulate funding — never send real bank or crypto funds.

| Script | Scopes | What it does |
| --- | --- | --- |
| `rails-api-smoke.js` | `customers` | Public OpenAPI plus signed `GET /partner` and `GET /customers` (optionally one customer read via `NASH_TEST_CUSTOMER_ID`). |
| `rails-flows.js` | `api_keys`, `customers`, `wallets_and_bank_accounts`, `fiat_ramp`, `webhooks` | Read-only signed GETs across the surface, including `/asset-rates` and `/payment-methods`. |
| `rails-kyc.js` | `customers` | Onboards a fresh `sdk-kyc-*-e2e@nash.io` customer to `TIER_1` (personal information, source of funds, wizard resume, scan simulation), accepts pending terms, uploads the synthetic `fixtures/proof-of-address.pdf`, and has it approved via the admin endpoint until `requirements` and `pendingReviews` are empty. |
| `rails-fiat-ramp.js` | `customers`, `wallets_and_bank_accounts`, `fiat_ramp` | Onboards a customer, verifies an ephemeral ETH wallet (EIP-712 challenge) and an IBAN (`NASH_NFR_IBAN`, default `DE29100100100987654321`), then completes a buy (`NASH_NFR_BUY_FIAT_AMOUNT`, default `100.00` EUR) and a deposit sell (`NASH_NFR_SELL_CRYPTO_AMOUNT`, default `0.1` ETH); the sell `assetHash` comes from `getAssetRates()`. |
| `rails-fiat-ramp-for-partner.js` | same | The same buy and sell acting as the partner (`nash-act-as: partner`), with the partner's Nash wallet and a verified external wallet; reconciles via `GET /orders?partner_orders_only=true`. |
| `rails-sell-nash-wallet-for-partner.js` | `wallets_and_bank_accounts`, `fiat_ramp`, `blockchain_transactions` | Sells `NASH_NFR_SELL_BTC_AMOUNT` / `NASH_NFR_SELL_ETH_AMOUNT` (defaults `0.01` BTC, `0.1` ETH) from the partner's funded Nash wallets: quote, confirm, fill DH pool, read medium fees, MPC-sign, prepare/iterate to a transaction hash, then wait for `COMPLETED`. Always Rails-only auth. **Sends real sandbox crypto and consumes network fees on every run.** |

The scripts follow the [customer onboarding](https://rails.sandbox.nash.io/dashboard/guides/customers), [required KYC data](https://rails.sandbox.nash.io/dashboard/guides/required-kyc-data), [fiat-ramp](https://rails.sandbox.nash.io/dashboard/guides/fiat-ramp), [external-wallet](https://rails.sandbox.nash.io/dashboard/guides/wallets), [bank-account](https://rails.sandbox.nash.io/dashboard/guides/bank-accounts) and [Sign & Send Transactions](https://rails.sandbox.nash.io/dashboard/guides/sign-send-transactions) guides. The fiat-ramp scripts poll quotes and order history until `COMPLETED` (accepting rate reconfirmation; signed sells wait up to 15 minutes) and simulate payment only through the sandbox setup endpoint.

Failed `fillDhPool`/`prepareTransaction`/`iterateTransaction` calls print full JSON request bodies including signed transaction data, so treat that output as sensitive. `client.rails.signPayload({ kind, payload })` builds the prepare/iterate bodies and lazily fills DH pools; on macOS ARM64 the SDK selects protocol 4.12.2's bundled WASM (`src/client/mpcRuntime.ts`), checkable offline with `node integration-tests/rails/support/mpc-runtime.js` after building. All six scripts pass against the sandbox as of 2026-11-06.

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
