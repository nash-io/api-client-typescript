# Align the Rails client with the current Rails API

Source: `https://rails.sandbox.nash.io/api/v1/openapi.json` (OpenAPI 3.0.3, `info.version` v1, fetched 2026-11-06) and the [API reference](https://rails.sandbox.nash.io/dashboard/guides/api-reference). The request-signing contract is unchanged: six-field canonical request, `Authorization: Token`, `nash-timestamp`, `nash-signature`, selectors, and multipart digest. `requestSigning.ts` needs no change.

Read-only sandbox probes made with `.env` credentials on 2026-11-06 confirmed these findings:

- Responses use UPPERCASE enums: `environment: "SANDBOX"`, `type: "SELL"`, `status: "COMPLETED"`, wallet `type: "NASH"`, `blockchain: "ETH"`, and webhook `events: ["KYC_UPDATED", ...]`. Asset symbols, `fiatAsset`, and `currency` stay lowercase (`eth`, `eur`).
- Money fields are objects. Examples: `fiatAmount: {amount, currency}`, `cryptoAmount: {amount, assetHash, blockchain, blockchainPrecision, symbol}`, and `rate: {amount, currencyA, currencyB}`.
- `POST /quotes/dry-quote` rejects the legacy `fiatAmount: "100.00"` with `400 invalid_payload` and `field: "amounts"`. The server accepted lowercase `type: "buy"` and `blockchain: "eth"` on input. The OpenAPI document states case-insensitive input only for `type`.
- `GET /webhooks/subscriptions/{id}/deliveries` returns 404 because the route was removed.
- A live quote returned `bankDepositInstructions: null`, although the OpenAPI document does not mark that field nullable. Keep it `| null`.

The two route inventories have the same size (44 operations each) but differ in two operations each:

| Client only (remove/fix) | Spec only (add) |
| --- | --- |
| `POST /transactions/signatures/dh-pool` | `POST /transactions/dh-pool` |
| `GET /webhooks/subscriptions/{subscription_id}/deliveries` | `GET /asset-rates` |

Before deleting or renaming any exported symbol, run `xd://lsp` references on it. Each removal below is a clean cutover: no aliases and no deprecated re-exports.

## 1. Routes

- [x] 1.1 `src/client/rails/routes.ts`: change `fillDhPool.path` to `/transactions/dh-pool`. Partner act-as still applies through the existing `/transactions/` prefix rule in `base.ts`.
- [x] 1.2 Delete route `listSubscriptionDeliveries`, plus `WebhooksClient.listSubscriptionDeliveries` (`src/client/rails/webhooks.ts`), `RailsClient.listSubscriptionDeliveries` (`src/client/rails/client.ts`), and the types `RailsListSubscriptionDeliveriesResponse` and `RailsWebhookDeliveriesResponse` (`src/types/rails/webhooks.ts`). Replace callers with `listWebhookDeliveries({ subscription_id })`.
- [x] 1.3 Add route `getAssetRates: { method: 'GET', path: '/asset-rates' }`. Add `OrdersClient.getAssetRates()` with no selector, the facade method in `client.ts`, and the types `RailsAssetRate` and `RailsGetAssetRatesResponse = { environment, rates: RailsAssetRate[] }` in `orders.ts`. `RailsAssetRate` has these fields:
  - `assetHash`, `blockchain`, `blockchainPrecision`, `name`, `symbol`
  - `buy` and `sell`, each `{ price: RailsRate, priceAfterFee: RailsRate, status: 'AVAILABLE' | 'DISABLED_HIDDEN' | 'UNDER_MAINTENANCE' }`
- [x] 1.4 `listPaymentMethods(customerId, filters?: RailsListPaymentMethodsFilters)`: forward `query: filters` and add `RailsListPaymentMethodsFilters { cursor?: string; limit?: number }`. Update `wallets.ts` and the facade.

## 2. Shared types (`src/types/rails/common.ts`)

- [x] 2.1 `RailsEnvironment = 'SANDBOX' | 'PRODUCTION'`.
- [x] 2.2 Add the money shapes: `RailsFiatQuantity { amount: string; currency: string }`, `RailsCryptoQuantityInput { amount: string; assetHash: string; blockchain: string }`, `RailsCryptoQuantity extends RailsCryptoQuantityInput { blockchainPrecision: number; symbol: string }`, and `RailsRate { amount: string; currencyA: string; currencyB: string }`.
- [x] 2.3 Delete `RailsCurrency` (`{unit, amount, scale}`) and `RailsMonetaryAmount`. Migrate every import.
- [x] 2.4 Update `RailsPartner`:
  - `kybStatus: 'NOT_APPLIED' | 'PENDING_KYC' | 'APPROVED'`.
  - Add `limits: { monthlyRequests: number; requestsPerMinute: number; tier: 'STARTER' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE' }`.
  - Add `usage: { month: string; requests: number; fiatRamp: { buyVolume; sellVolume; totalVolume: RailsFiatQuantity; completedOrders: number } }`.

## 3. Enum casing (all `src/types/rails/*.ts`)

Convert every response and request enum to the UPPERCASE values in the OpenAPI document. Do not add client-side case conversion.

- [x] 3.1 `credentials.ts`: uppercase `RailsCredentialScope` (`CUSTOMERS`, `WALLETS_AND_BANK_ACCOUNTS`, `FIAT_RAMP`, `WEBHOOKS`, `API_KEYS`, `BLOCKCHAIN_TRANSACTIONS`), and rename `RailsCredential.expireAt` to `expiresAt`.
- [x] 3.2 `customers.ts`: uppercase `RailsKycStatusValue` and add `'BLOCKED'`. Also uppercase `RailsKycFailureDetail`, `RailsKycRequirementFieldName`, `RailsAgreementType`, `RailsKycRequirementField.type` (`STRING | DATE`), `RailsKycRequirement.type` and `.step` (`PERSONAL_INFORMATION | SOURCE_OF_FUNDS | IDENTITY_VERIFICATION | COMPLETE`), and `RailsKycRevalidationStatus`. Add `existing: boolean` to `RailsCreatedCustomer`.
- [x] 3.3 `compliance.ts`: uppercase the obligation `type`, `RailsComplianceObligationStatus`, `RailsComplianceRequestType`, pending-review `type` and `status` (`PENDING_REVIEW`), `RailsAccountPurpose`, `RailsIndustry`, `RailsJobStatus`, and `RailsSourceOfIncome`. Type `RailsComplianceObligation.requirements` as `Array<{ field: RailsComplianceFieldName; key: string; mandatory: boolean; options?: string[]; type: 'STRING' | 'DATE' | 'ENUM' | 'CURRENCY' | 'BOOLEAN' | 'ENUM_LIST' | 'UPLOAD' | 'IBAN' }>`. `RailsComplianceFieldName` is the 28-value `field` enum from the `ComplianceObligation` schema.
- [x] 3.4 `wallets.ts`: uppercase `RailsBlockchain`, `RailsAccountWalletBlockchain`, `RailsPaymentMethodType`, `RailsPaymentMethodStatus`, `RailsIbanVerificationStatus`, and `RailsAccountWallet.type` (`NASH | EXTERNAL`).
- [x] 3.5 `orders.ts`: uppercase `RailsOrderStatus`, `RailsHistoryOrderStatus`, `RailsSettlementType`, quote `type` (`BUY | SELL`), and `transferMethod` (`DEPOSIT | PERMIT`). Delete `RailsQuoteBlockchain`, which now has the same 12 values as `RailsBlockchain`, and use `RailsBlockchain` everywhere.
- [x] 3.6 `webhooks.ts`: the request enum and the response enum now differ. Keep `RailsWebhookEvent` as the lowercase dotted request enum, remove `'order.created'`, and add `'quote.cancelled'`. Add `RailsWebhookEventType` (`KYC_UPDATED | COMPLIANCE_REQUEST | QUOTE_CREATED | QUOTE_UPDATED | QUOTE_EXPIRED | QUOTE_CANCELLED | ORDER_STATUS_CHANGED | WALLET_VERIFIED | IBAN_VERIFIED`) and use it for `RailsWebhookSubscription.events` and `RailsWebhookDelivery.eventType`. Uppercase `RailsWebhookDeliveryStatus` and attempt `outcome`.

## 4. Quotes, orders, payment methods (shape changes)

- [x] 4.1 `RailsQuote`:
  - Set `fiatAmount: RailsFiatQuantity`, `cryptoAmount: RailsCryptoQuantity`, and `rate: RailsRate`. These fields are no longer strings.
  - Add `kind: 'QUOTE'`, `createdAt: string`, and `completedAt: string | null`.
  - Keep `bankDepositInstructions` and `cryptoDepositInstructions` as `| null`, because the live API returned null.
- [x] 4.2 `RailsHistoryOrder`: add `kind: 'ORDER'` and drop `type?: never`. `kind` is now the discriminator.
- [x] 4.3 In `RailsQuoteHistoryResponse`, rename `cursor` to `nextCursor`.
- [x] 4.4 `RailsQuoteRequest`: change `fiatAmount` to `RailsFiatQuantity` and `cryptoAmount` to `RailsCryptoQuantityInput`. Keep the buy/sell `transferMethod` union, with uppercase values.
- [x] 4.5 Replace `RailsQuoteEstimationResponse` with `{ environment; type: 'BUY' | 'SELL'; fixedValue: 'FIAT' | 'CRYPTO'; fiatAmount: RailsFiatQuantity; cryptoAmount: RailsCryptoQuantity; cryptoAmountAfterSettlement: RailsCryptoQuantity | null; settlementNetworkFee: RailsCryptoQuantity; rate: RailsRate }`. This removes `side`, `base`, `target`, `targetAfterSettlement`, and `rateAmount`. `cryptoAmountAfterSettlement` is `| null` because the spec documents it as null for sells.
- [x] 4.6 `RailsOrder`: set `fiatAmount?: RailsFiatQuantity` and `cryptoAmount?: RailsCryptoQuantity`.
- [x] 4.7 `RailsPaymentMethod`: replace `iban` with `last4: string | null`.
- [x] 4.8 `RailsPaymentMethodsResponse`: replace `metadata` with `nextCursor: string | null`.
- [x] 4.9 Add `expiresAt: string` to `RailsWalletChallengeResponse`.

## 5. Compliance money

- [x] 5.1 In `RailsSourceOfFunds`, type `annualIntendedVolume`, `giftAmount`, and `grossAnnualIncome` as `RailsFiatQuantity`. Keep the nested `sourceOfFunds?` because the spec description allows answers "at the top level or under `sourceOfFunds`".

## 6. Transport money handling (`src/client/rails/base.ts`)

- [x] 6.1 Rewrite `validateMoneyInputs`:
  - The keys `cryptoAmount`, `fiatAmount`, `annualIntendedVolume`, `giftAmount`, and `grossAnnualIncome` must be objects with a string `amount`. Reject strings and numbers.
  - The bare key `amount` must remain a string.
  - Keep the recursion and the operation gate (`createQuote`, `createDryQuote`, `submitSourceOfFunds`).

  Without this change, the SDK throws on every valid quote request.
- [x] 6.2 `parseRailsResponse`: drop `cryptoAmount` and `fiatAmount` from the key regex, because they are now objects. Keep `amount` and the fee keys.

## 7. Blockchain-transaction types (`src/types/rails/blockchain_transactions.ts`) and `signPayload`

- [ ] 7.1 `RailsDhPoolRequest.blockchain: RailsBlockchain`. Replace `RailsDhPoolResponse.dhFillPool` with `serverPublics: string[]`. In `RailsClient.signPayload` (`client.ts`), the `fillPoolFn` must read `response.serverPublics`; keep the string-array guard.
- [ ] 7.2 `RailsGetBlockchainFeesResponse`: rename `getBlockchainFees` to `blockchainFees`. Make `blockchain: RailsBlockchain` and `priceLow`, `priceMedium`, and `priceHigh` required strings, which the regex already stringifies. Leave the other fee fields optional and nullable. Change `getBlockchainFees(blockchain: RailsBlockchain)`.
- [ ] 7.3 Add `RailsTransactionElement { blockchain; elementType; payload; payloadHash; payloadHashFunction; signatureFunction }`, using camelCase as the server now does.
  - `RailsPrepareTransactionResponse = { environment; preparedTransaction: { reference: string; transaction: { transactionFee: RailsCryptoQuantityInput; transactionNonce?: number | null; transactionSpecific?: Record<string, unknown> }; transactionElements: RailsTransactionElement[] } }`.
  - `RailsIterateTransactionResponse = { environment; iteratedTransaction: { transactionElements: RailsTransactionElement[]; transactionHash?: string | null } }`.
- [ ] 7.4 `RailsCancelTransactionResponse = { environment; cancelled: boolean }`.

## 8. Unit tests (`src/client/httpAuthentication.spec.ts`)

- [ ] 8.1 Blockchain-fees test (about lines 285-300): use a `blockchainFees` fixture key and change the assertions to `result.blockchainFees.*`.
- [ ] 8.2 Dry-quote and exact-money test (about lines 315-360):
  - Send `fiatAmount: { amount: '100.00', currency: 'eur' }` and uppercase enums.
  - Assert the new estimate fields, replacing the `base`/`target` checks.
  - Use the getQuote fixture `{"quote":{"fiatAmount":{"amount":9007199254740993,"currency":"eur"}}}` and expect `quote.quote.fiatAmount.amount === '9007199254740993'`.
  - The rejection cases are `fiatAmount: { amount: 0.1, currency: 'eur' }` and the legacy `fiatAmount: '100.00'`.
- [ ] 8.3 Source-of-funds test (about lines 362-373): replace `{ unit, amount, scale }` with `{ amount, currency }`. A string `grossAnnualIncome` must now reject.
- [ ] 8.4 Selector test: add `getAssetRates()`, which sends neither selector, and `listPaymentMethods(null, { limit: 1 })`, whose signed path must include `?limit=1`, to the existing selector assertions.
- [ ] 8.5 Grep the remaining specs for `listSubscriptionDeliveries`, `dhFillPool`, `expireAt`, and lowercase `'sandbox'` fixtures, and update them.

## 9. Integration tests (`integration-tests/rails/`)

- [ ] 9.1 Across all scripts and `support/fiat-ramp-helpers.js`, uppercase the asserted enums:
  - `environment`: `'SANDBOX'`.
  - Statuses: `'PENDING_USER_CONFIRMATION'`, `'CONFIRMED_WAITING_FOR_PAYMENT'`, `'COMPLETED'`, `'PENDING_USER_RATE_RECONFIRMATION'`, `'APPROVED'`, `'TIER_1'`, `'REJECTED'`, `'FAILED_LOCATION_VERIFICATION'`.
  - Types: `'EXTERNAL_BANK_ACCOUNT'`, wallet `'NASH'`/`'EXTERNAL'`, quote `'BUY'`/`'SELL'`, `'DEPOSIT'`.
  - KYC steps: `'PERSONAL_INFORMATION'`, `'SOURCE_OF_FUNDS'`, `'IDENTITY_VERIFICATION'`, `'COMPLETE'`.
  - Compliance values: `'DOCUMENT'`, `'PROOF_OF_ADDRESS'`, `'PENDING_REVIEW'`.
  - Uppercase the unsuccessful-state regex in `waitForCompleted`.
- [ ] 9.2 Blockchain identifiers must be split from asset symbols:
  - `rails-fiat-ramp.js` and `rails-fiat-ramp-for-partner.js`: set `blockchain`/`BLOCKCHAIN = 'ETH'` and keep `cryptoAsset: 'eth'`.
  - `rails-sell-nash-wallet-for-partner.js`: wallet lookup and `createQuote.blockchain` must use `scenario.blockchain` (`'BTC'`/`'ETH'`), with `cryptoAsset: asset` staying lowercase.
- [ ] 9.3 Quote request amounts in all three fiat-ramp scripts:
  - Buy: `fiatAmount: { amount, currency: 'eur' }`.
  - Sell: `cryptoAmount: { amount, blockchain, assetHash }`. Resolve `assetHash` from `client.rails.getAssetRates()` by matching `symbol` and `blockchain`, instead of hard-coding it. The sell script's `scenario.assetHash` can then be removed.
- [ ] 9.4 `rails-sell-nash-wallet-for-partner.js`, transaction flow:
  - Compare `confirmed.quote.cryptoAmount.amount` with `quote.cryptoAmount.amount`.
  - Read fees from `feeResponse.blockchainFees`.
  - Read `prepared.preparedTransaction` and `iterated.iteratedTransaction`.
  - Switch element and hash fields to camelCase (`transactionElements`, `payloadHash`, `payloadHashFunction`, `signatureFunction`, `transactionHash`) and delete the snake_case-to-camelCase remap comment and code.
  - `limit: 100` in `waitForCompleted` is clamped to 20 by the server. Set it to 20 explicitly.
- [ ] 9.5 `rails-kyc.js`:
  - `submitSourceOfFunds` sends `grossAnnualIncome: { amount: '50000', currency: 'eur' }` and `annualIntendedVolume: { amount: '10000', currency: 'eur' }`, plus uppercase `jobStatus`, `industry`, `sourceOfIncome`, and `accountPurposes`.
  - Assert `created.existing === false` on the fresh customer.
- [ ] 9.6 `rails-flows.js`: add read-only steps `signed GET /asset-rates` (`getAssetRates()`) and `signed GET /payment-methods` (`listPaymentMethods(null, { limit: 1 })`).
- [ ] 9.7 `rails-api-smoke.js`: no shape change needed. Optionally assert that `operations` includes `GET /asset-rates`.

## 10. Docs

- [ ] 10.1 `README.md` (about line 128): change "Send exactly one of `fiatAmount` and `cryptoAmount` as a decimal string" to the quantity-object shapes, and update the `transferMethod` values. Grep the README for the other renamed fields and lowercase enum examples.
- [ ] 10.2 `openspec/specs/nash-rails-api/spec.md`: update the route table (the dh-pool path, remove subscription deliveries, add `/asset-rates`) and the monetary-input requirement (quantity objects, not `{unit, amount, scale}` and not bare strings).
- [ ] 10.3 `CHANGELOG.md`: list the breaking type and method changes: enum casing, money objects, removed `listSubscriptionDeliveries`, `RailsCurrency`, `RailsMonetaryAmount`, and `RailsQuoteBlockchain`, and renamed response keys.

## 11. Gates

- [ ] 11.1 Run `yarn build`, `yarn test:lint`, `yarn test:unit`, and `yarn cov:check`.
- [ ] 11.2 Re-diff the `RAILS_ROUTES` method/path set against the live `openapi.json`. The two sets must be equal.
- [ ] 11.3 Live gate (sandbox, `.env`): run `yarn integration:rails`, then run `rails-kyc.js` separately, because it is not in that script. Record any failures caused by sandbox funding or simulation endpoints separately from SDK failures.
