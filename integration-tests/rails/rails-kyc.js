'use strict';

// yarn build
// node --env-file=.env integration-tests/rails/rails-kyc.js
// Requires NASH_API_KEY and NASH_API_SECRET with the customers scope.
// Creates a new sandbox customer on each run; no customer deletion API exists.

const assert = require('assert');
const { randomBytes } = require('crypto');
const { readFileSync } = require('fs');
const { join } = require('path');
const Nash = require('../../build/main');
const { decodeApiSecret } = require('../../build/main/client/requestSigning');
const getClientArgs = require('./support/client-args');
const formatError = require('./support/format-error');

const required = name => {
  assert(process.env[name], `Set ${name}`);
  return process.env[name];
};

function expectStep(snapshot, step) {
  assert.strictEqual(snapshot.environment, 'sandbox');
  assert(
    snapshot.requirements.some(requirement => requirement.step === step),
    `Expected ${step}; got ${JSON.stringify(snapshot.requirements)}`
  );
}

// Identical requests in one timestamp second produce the same signature.
const nextSigningSecond = () =>
  new Promise(resolve => setTimeout(resolve, 1010 - (Date.now() % 1000)));

async function run(afterOnboarding) {
  const credentials = {
    apiKey: required('NASH_API_KEY'),
    secret: required('NASH_API_SECRET')
  };
  const proofOfAddress = readFileSync(
    join(__dirname, '..', 'fixtures', 'proof-of-address.pdf')
  );
  const e2eSetupUrl =
    process.env.NASH_E2E_SETUP_URL ||
    'https://app.arm-dev1.nash.io/api/e2e/account_setup';
  const e2eAdminUrl =
    process.env.NASH_E2E_ADMIN_URL ||
    'https://admin.arm-dev1.nash.io/_admin/api/e2e/run_flow';
  const client = new Nash.Client(...getClientArgs());
  const email = `sdk-kyc-${Date.now()}-${randomBytes(6).toString(
    'hex'
  )}-e2e@nash.io`;
  const step = async (name, fn) => {
    await nextSigningSecond();
    let result;
    try {
      result = await fn();
    } catch (error) {
      console.log(`${name}: FAIL`);
      if (error && typeof error === 'object' && !error.step) error.step = name;
      throw error;
    }
    console.log(`${name}: PASS`);
    return result;
  };

  try {
    if (process.env.NASH_RAILS_ONLY === '1') {
      // ponytail: private fields match rails-flows.js; use public Rails-only login if added.
      client.mode = Nash.ClientMode.MPC;
      client.requestCredentials = {
        apiKey: credentials.apiKey,
        requestKey: decodeApiSecret(credentials.secret).requestKey
      };
    } else {
      await client.login(credentials);
    }

    await nextSigningSecond();
    const partner = await client.rails.getPartner();
    assert.strictEqual(partner.environment, 'sandbox');
    assert(partner.id, 'Partner ID is missing');

    const customer = await step('create sandbox customer', async () => {
      const created = await client.rails.createCustomer({
        email,
        countryCode: 'NL',
        stateCode: 'NH',
        offeringConsent: true
      });
      assert.strictEqual(created.environment, 'sandbox');
      assert.strictEqual(created.email, email);
      assert.strictEqual(typeof created.id, 'string');
      assert(created.id, 'Customer ID is missing');
      console.log(`Customer retained: ${created.id} (${email})`);
      const stored = await client.rails.getCustomer(created.id);
      assert.strictEqual(stored.id, created.id);
      assert.strictEqual(stored.environment, 'sandbox');
      return created;
    });
    const id = customer.id;

    await step('initiate KYC and repeat without advancing', async () => {
      const first = await client.rails.initiateCustomerKyc(id);
      expectStep(first, 'personal_information');
      await nextSigningSecond();
      const repeated = await client.rails.initiateCustomerKyc(id);
      expectStep(repeated, 'personal_information');
      assert.strictEqual(repeated.status, first.status);
    });

    await step('personal information advances to source of funds', async () => {
      await client.rails.confirmPersonalInformation(id, {
        firstName: `Clara${Array.from(randomBytes(8), byte =>
          String.fromCharCode(97 + (byte % 26))
        ).join('')}`,
        lastName: `Burt${Array.from(randomBytes(8), byte =>
          String.fromCharCode(97 + (byte % 26))
        ).join('')}`,
        birthdate: '1990-01-02',
        countryOfBirth: 'NL',
        cityOfBirth: 'Amsterdam',
        taxResidencyCountry: 'NL',
        taxIdNumber: '123456789',
        address: {
          roadAddress: '1 House Street',
          city: 'Amsterdam',
          postalCode: '1011AB',
          countryOfResidence: 'NL'
        }
      });
      expectStep(await client.rails.getCustomerKyc(id), 'source_of_funds');
    });

    await step(
      'source of funds advances to identity verification',
      async () => {
        await client.rails.submitSourceOfFunds(id, {
          jobStatus: 'employed',
          jobTitle: 'Engineer',
          industry: 'technology',
          grossAnnualIncome: '50000 eur',
          sourceOfIncome: 'salary',
          annualIntendedVolume: '10000 eur',
          accountPurposes: ['crypto_exchange', 'investment']
        });
        expectStep(
          await client.rails.getCustomerKyc(id),
          'identity_verification'
        );
      }
    );

    await step(
      'wizard initiation resumes case with a fresh token',
      async () => {
        const first = await client.rails.initiateCustomerKyc(id);
        expectStep(first, 'identity_verification');
        assert(first.wizard, 'Missing KYC wizard');
        assert.strictEqual(new URL(first.wizard.url).protocol, 'https:');
        assert(first.wizard.caseId, 'Missing wizard case ID');
        assert(first.wizard.mediaToken, 'Missing wizard media token');
        await nextSigningSecond();
        const resumed = await client.rails.initiateCustomerKyc(id);
        expectStep(resumed, 'identity_verification');
        assert(resumed.wizard, 'Missing resumed KYC wizard');
        assert.strictEqual(resumed.wizard.caseId, first.wizard.caseId);
        assert(resumed.wizard.mediaToken, 'Missing refreshed media token');
        assert.notStrictEqual(
          resumed.wizard.mediaToken,
          first.wizard.mediaToken
        );
      }
    );

    await step('complete identity scan using dev1 E2E endpoint', async () => {
      const { default: fetch } = await import('node-fetch');
      const AbortController = require('abort-controller');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);
      try {
        const response = await fetch(e2eSetupUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partner_id: partner.id,
            customer_id: id,
            flow: 'complete_kyc_scan'
          }),
          redirect: 'error',
          signal: controller.signal
        });
        assert(
          response.ok,
          `complete_kyc_scan returned HTTP ${response.status}`
        );
        await response.text();
      } finally {
        clearTimeout(timer);
      }
    });

    await step(
      'KYC reaches tier_1 with no outstanding onboarding steps',
      async () => {
        const deadline = Date.now() + 120000;
        let snapshot;
        do {
          snapshot = await client.rails.getCustomerKyc(id);
          assert.strictEqual(snapshot.environment, 'sandbox');
          assert(
            ![
              'rejected',
              'failed_identity_verification',
              'failed_location_verification'
            ].includes(snapshot.status),
            `KYC failed: ${snapshot.status} (${snapshot.failureDetail})`
          );
          if (snapshot.status === 'tier_1') break;
          await new Promise(resolve => setTimeout(resolve, 2000));
        } while (Date.now() < deadline);
        assert.strictEqual(
          snapshot.status,
          'tier_1',
          `KYC approval timed out: ${snapshot.status} (${
            snapshot.failureDetail
          })`
        );
        assert(
          snapshot.requirements.every(
            requirement => requirement.step === 'complete'
          ),
          `Approved customer has outstanding steps: ${JSON.stringify(
            snapshot.requirements
          )}`
        );
        const stored = await client.rails.getCustomer(id);
        assert.strictEqual(stored.id, id);
        assert.strictEqual(stored.kyc.status, 'tier_1');
      }
    );

    await step('accept all pending customer terms', async () => {
      const pending = await client.rails.getCustomerTerms(id);
      assert.strictEqual(pending.environment, 'sandbox');
      if (pending.agreements.length > 0) {
        const agreementIds = pending.agreements.map(agreement => agreement.id);
        const accepted = await client.rails.acceptCustomerTerms(id, {
          agreements: agreementIds
        });
        assert.strictEqual(accepted.environment, 'sandbox');
        assert.deepStrictEqual(
          accepted.agreements.map(agreement => agreement.id).sort(),
          agreementIds.slice().sort()
        );
      }
      await nextSigningSecond();
      const remaining = await client.rails.getCustomerTerms(id);
      assert.deepStrictEqual(remaining.agreements, []);
    });

    const obligations = await client.rails.getComplianceRequirements(id);
    assert.strictEqual(obligations.environment, 'sandbox');
    for (const obligation of obligations.requirements) {
      if (obligation.type !== 'document') continue;
      assert.strictEqual(
        obligation.requestType,
        'proof_of_address',
        'The synthetic fixture is only for sandbox proof-of-address requests'
      );
      assert(obligation.id, 'Document obligation is missing its request ID');
      await step('submit sandbox proof-of-address document', async () => {
        const uploaded = await client.rails.submitComplianceDocuments(
          id,
          obligation.id,
          [
            {
              data: proofOfAddress,
              filename: 'sandbox-proof-of-address.pdf',
              contentType: 'application/pdf'
            }
          ]
        );
        assert.strictEqual(uploaded.environment, 'sandbox');
        assert.strictEqual(uploaded.documents.length, 1);
        assert(
          uploaded.documents[0].id,
          'Upload response is missing the document ID'
        );
      });
      await step(
        'submitted document is pending administrator review',
        async () => {
          const compliance = await client.rails.getComplianceRequirements(id);
          assert.strictEqual(compliance.environment, 'sandbox');
          assert.strictEqual(
            compliance.requirements.some(
              requirement => requirement.id === obligation.id
            ),
            false,
            'Submitted document must no longer require a customer action'
          );
          const review = compliance.pendingReviews.find(
            pending => pending.id === obligation.id
          );
          assert(review, 'Submitted document is missing from pendingReviews');
          assert.strictEqual(review.type, 'document');
          assert.strictEqual(review.status, 'pending_review');
          assert.strictEqual(review.requestType, obligation.requestType);
          assert.strictEqual(
            review.blockFiatServices,
            obligation.blockFiatServices
          );
        }
      );
    }

    await step(
      'administrator approves submitted compliance documents',
      async () => {
        const { default: fetch } = await import('node-fetch');
        const AbortController = require('abort-controller');
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 30000);
        try {
          const response = await fetch(e2eAdminUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              partner_id: partner.id,
              customer_id: id,
              flow: 'approve_compliance_documents'
            }),
            redirect: 'error',
            signal: controller.signal
          });
          assert(
            response.ok,
            `approve_compliance_documents returned HTTP ${response.status}`
          );
          await response.text();
        } finally {
          clearTimeout(timer);
        }
      }
    );

    await step('approved customer has no compliance obligations', async () => {
      const compliance = await client.rails.getComplianceRequirements(id);
      assert.strictEqual(compliance.environment, 'sandbox');
      assert.deepStrictEqual(compliance.requirements, []);
      assert.deepStrictEqual(compliance.pendingReviews, []);
    });
    if (afterOnboarding)
      await afterOnboarding({ client, customer, partner, e2eSetupUrl, step });
  } finally {
    client.disconnect();
  }
}

module.exports = run;

if (require.main === module) {
  run().catch(error => {
    console.error(formatError('KYC integration', error));
    process.exitCode = 1;
  });
}
