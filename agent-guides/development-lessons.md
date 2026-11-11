# Development lessons

These observations come from implementing `add-nash-rails-api`. Treat tool failures and audit counts as a dated workstation snapshot; re-run checks for current results.

## What worked

- **Contract-first** paid off. Refresh the target GraphQL schema and inspect the deployed Rails OpenAPI and route guides before choosing fields, prefixes, scopes, envelopes, or multipart behavior. The OpenAPI inventory contained 46 method/path pairs; the SDK and local smoke run covered all 46.
- **Wire-level proof** caught issues that mocks alone would miss. A temporary local HTTP receiver verified captured signatures against a known public key, exact path/query/body bytes, multipart SHA-256 digests, concurrent customer context, and redirect handling. The completed run verified 51 signed requests. Use a known test key, never a real credential, and put the harness under `$TMPDIR`.
- **Separate acceptance gates.** Deterministic tests and the local receiver prove SDK behavior; only a live request proves backend acceptance. If credentials are unavailable, report that gate as deferred. Do not infer upload limits that the OpenAPI and compliance guide omit.

## Failures and recovery

- **Validator output can outlive its exit status.** `src/client/processSchema.ts` prints operation errors and returns without setting a nonzero exit code. Read the diagnostics, record every failing operation, and verify the changed operation against the refreshed schema; a green shell status alone is not proof.
- **Do not assume `AbortController` is global.** The package supports Node 14.3 and the Jest VM lacked the global even on a newer host. Use the declared `abort-controller` dependency for timed fetches and retain a test that exercises that path.

## Reporting rule

Record the exact command, observed result, and boundary for each gate. Mark live acceptance, upload limits, coverage, or schema validation as unverified whenever the evidence does not cover them.
