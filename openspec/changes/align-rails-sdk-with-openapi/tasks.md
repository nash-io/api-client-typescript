## 1. Remove the nonexistent instant-buy route

- [x] 1.1 Delete `confirmInstantBuy` from `src/client/rails/routes.ts`, `src/client/rails/orders.ts` and `src/client/rails/client.ts`; delete `RailsConfirmInstantBuyRequest/Response` and `RailsInstantBuyConfirmationResponse` from `src/types/rails/orders.ts`. Run `xd://lsp` references first and migrate any caller (README, integration tests).
- [x] 1.2 Remove the `confirm-instant-buy` row from the coverage table in `openspec/specs/nash-rails-api/spec.md`.

## 2. Source-of-funds wire contract

- [x] 2.1 Rewrite `RailsSourceOfFunds` (`src/types/rails/compliance.ts`) with the OpenAPI camelCase keys (`accountPurposes`, `annualIntendedVolume`, `confirm`, `donorName`, `giftAmount`, `grossAnnualIncome`, `inFullTimeEducation`, `incomeDetails`, `industry`, `investmentType`, `jobStatus`, `jobTitle`, `offeringConsent`, `otherAccountPurpose`, `otherIndustry`, `sourceOfIncome`); drop the `*_local` fields and the index signature; type the enum fields.
- [x] 2.2 Update the money-key regex in `validateMoneyInputs` (`src/client/rails/base.ts`) to `annualIntendedVolume|giftAmount|grossAnnualIncome`. Current string-only behavior kept (no structured-object rejection added); spec wording amended in 8.3.
- [x] 2.3 Update `integration-tests/rails/rails-kyc.js:141-144` to camelCase keys and the README snippets. NOT DONE: sandbox confirmation of whether snake_case was also accepted (no credentials available).

## 3. Response field names

- [x] 3.1 `RailsCredential`: `insertedAt` -> `createdAt`.
- [x] 3.2 `RailsWebhookSubscription`: `cancelledAt`, `createdAt`, `updatedAt`; `events: RailsWebhookEvent[]`.
- [x] 3.3 `RailsWebhookDelivery` / `RailsWebhookDeliveryAttempt`: convert every key to camelCase (`subscriptionId`, `eventId`, `eventType: RailsWebhookEvent`, `attemptsCount`, `deliveredAt`, `lastAttemptedAt`, `lastError`, `lastResponseStatus`, `attemptedAt`, `durationMs`, `responseStatus`); `outcome: 'delivered' | 'failed'`. Keep `RailsListWebhookDeliveriesFilters` snake_case (query params).
- [x] 3.4 `RailsHistoryOrder`: `inserted_at` -> `createdAt`; add `type?: never` so `RailsQuote | RailsHistoryOrder` can be discriminated.
- [x] 3.5 Update README/integration-test readers of any renamed field (grep each old name).

## 4. Missing fields and wrong request shapes

- [ ] 4.1 `RailsQuote`: add `cryptoAsset: string | null`, `rate: string | null`. `RailsOrder`: add `cryptoAsset?`, `fiatAsset?`.
- [ ] 4.2 `RailsKycSnapshot`, `RailsKycStatus`, `RailsKycInitiation`: add `revalidationStatus` (`pending_scanning | pending_approval | completed | completed_id_expiring_soon`); add nullable `wizard` to snapshot/status.
- [ ] 4.3 `RailsPersonalInformationRequest`: replace with the schema's required fields (`firstName`, `lastName`, `birthdate`, `countryOfBirth`, `cityOfBirth`, `taxResidencyCountry`, `taxIdNumber`, `address{roadAddress, city, postalCode, countryOfResidence}`); remove the stale boolean.
- [ ] 4.4 `RailsComplianceObligation.requirements`: type as `{ field: string; type: string; mandatory: boolean; options?: string[] }[]`.

## 5. Enumerations as unions (from the OpenAPI enums)

- [ ] 5.1 Quote/order: `status` (25 values; `HistoryOrder.status` 11), `blockchain`, `settlementType`.
- [ ] 5.2 Wallets: `blockchain` for challenge/registration/`RailsBlockchains`; `neo` only in the `GET /wallets` response type. Payment methods: `type`, `status`.
- [ ] 5.3 KYC: `status`/`kycStatus` (11 values), `failureDetail` (45), requirement field `field`/`type`, agreement `type`. Compliance obligation `status` and `requestType`.
- [ ] 5.4 `RailsPartner.scopes: RailsCredentialScope[]` (type-only import; check for cycles).
- [x] 5.5 Source-of-funds enums (`jobStatus`, `sourceOfIncome`, `accountPurposes[]`, `industry`).

## 6. Remove index signatures from closed request types

- [ ] 6.1 Remove `[key: string]: unknown` from `RailsCustomerCreation`, `RailsAnswerComplianceRequest`, `RailsPersonalInformationRequest`, `RailsSourceOfFunds`, `RailsTermsAcceptanceRequest`, wallet challenge/registration, IBAN verification and webhook creation requests. Keep it on the MPC payload types (schemas are open there) only if a field list isn't documented.
- [ ] 6.2 Run `tsc`; fix integration scripts that relied on extra keys.

## 7. New and changed operations

- [ ] 7.1 Add `getBlockchainFees(blockchain)`: route `GET /transactions/blockchain-fees` with `query: { blockchain }` (acts as partner via the existing `/transactions/` rule), response type with nullable integer `price*`, `baseFeePerGas`, `maxFeePerGas*`, `maxPriorityFeePerGas*`.
- [ ] 7.2 Decide fee-integer handling: add these keys to the response stringifying regex in `parseRailsResponse` (preferred, matches the spec's exact-money rule) or document the 2^53 limit. Update the response type accordingly.
- [ ] 7.3 Replace the hand-built fee request in `integration-tests/rails/rails-sell-nash-wallet-for-partner.js:69-80` with the new method; update the README lines that say no fee reader exists (~69, ~200).
- [ ] 7.4 `RailsApiError`: add `readonly reason?: string` from `error.reason`; export a `RailsErrorCode` union if desired.
- [ ] 7.5 Check against the live server whether `cancelQuote`, `recalculateQuote`, `reconfirmQuote` need a `{}` body (the fiat-ramp guide sends one; OpenAPI defines none). Change only if the server requires it.

## 8. Specs and docs

- [ ] 8.1 Update `openspec/specs/authenticated-http-requests/spec.md` to the six-field canonical request (`timestamp, METHOD, path, customer_id, act_as, body`), the new interoperability vector (`478f8bb6...19e1`, three newlines after the path), and add requirements and scenarios for `nash-act-as: partner`: exactly one selector, `null` customer id, `/transactions/*` always partner, no override via caller headers.
- [ ] 8.2 `openspec/specs/nash-rails-api/spec.md`: add `GET /customers/{customer_id}/terms` and `GET /transactions/blockchain-fees` to the table; fix the garbled `/api/v1` sentence at line 69; allow HTTP to loopback hosts as `base.ts` does, or tighten the code.
- [ ] 8.3 Reconcile the money-input requirement with behavior (see 2.2).
- [ ] 8.4 Fix the credential migration text in `README.md:120` and `CHANGELOG.md:9`: `Client.createApiKey` only grants `SIGNING`/`TRADING` scopes; Rails-scoped credentials come from the dashboard with a registered request key.
- [ ] 8.5 `CHANGELOG.md:10`: describe the six-field request including `nash-act-as`.
- [ ] 8.6 Remove the blank-line gaps in `src/client/rails/base.ts` (29-30, 192-193, 209-213).

## 9. Verification

- [ ] 9.1 Extend `src/client/httpAuthentication.spec.ts` only for new behavior: `getBlockchainFees` signs `nash-act-as: partner` with the query in the signed path; the source-of-funds money check fires on camelCase keys; `RailsApiError.reason` is surfaced.
- [ ] 9.2 Run `yarn build`, `yarn test:lint`, `yarn test:unit`, `yarn cov:check`. Report any gate skipped by the environment (`yarn` is not on PATH in the review shell; `npx jest --no-watchman` works).
- [ ] 9.3 Re-run the OpenAPI diff: method/path set of `RAILS_ROUTES` must equal the live `/api/v1/openapi.json` paths exactly.
- [ ] 9.4 Live gate (separate, needs credentials): run `yarn integration:rails` against sandbox, and confirm the exchange GraphQL host accepts the six-field signature on API-key requests.
