'use strict';

// yarn build
// node --env-file=.env integration-tests/rails/rails-fiat-ramp-for-partner.js
// Sandbox only. Requires NASH_API_KEY/NASH_API_SECRET with fiat_ramp and
// wallets_and_bank_accounts scopes. Acts as the partner itself
// (nash-act-as: partner, customerId null in the SDK); no customer is created.

const assert = require('assert');
const { createECDH } = require('crypto');
const { keccak256 } = require('web3-utils');
const {
  signTypedData,
  SignTypedDataVersion
} = require('@metamask/eth-sig-util');
const Nash = require('../../build/main');
const { decodeApiSecret } = require('../../build/main/client/requestSigning');
const getClientArgs = require('./support/client-args');
const formatError = require('./support/format-error');
const {
  normalizeAddress,
  checkConfirmed,
  markPaid,
  waitForCompleted
} = require('./support/fiat-ramp-helpers');

const BLOCKCHAIN = 'eth';
const required = name => {
  assert(process.env[name], `Set ${name}`);
  return process.env[name];
};

// Identical requests in one timestamp second produce the same signature.
const nextSigningSecond = () =>
  new Promise(resolve => setTimeout(resolve, 1010 - (Date.now() % 1000)));

// Creates, confirms, funds and completes one buy and one sell for the partner
// account, bound to `wallet` ({ blockchain, address }). Wallet-agnostic: add
// further wallet kinds (e.g. a verified external wallet) by calling it again.
async function partnerOrders(
  { client, partner, e2eSetupUrl, step },
  wallet,
  label
) {
  // Only a sell needs a payout account; a buy must not depend on it.
  const verifyPayout = async () => {
    const existing = await client.rails.listPaymentMethods(null);
    assert.strictEqual(existing.environment, 'sandbox');
    const approved = existing.paymentMethods.find(
      item => item.type === 'external_bank_account' && item.status === 'approved'
    );
    if (approved) return approved;
    const verified = await client.rails.verifyBankAccount(null, {
      iban: process.env.NASH_NFR_IBAN || 'DE29100100100987654321'
    });
    assert.strictEqual(verified.environment, 'sandbox');
    assert.strictEqual(
      verified.status,
      'approved',
      `Sandbox IBAN verification needs attention: ${verified.status}`
    );
    const listed = await client.rails.listPaymentMethods(null);
    const stored = listed.paymentMethods.find(
      item => item.id === verified.paymentMethod.id
    );
    assert(stored, 'Approved payout account is missing from payment methods');
    assert.strictEqual(stored.status, 'approved');
    return stored;
  };

  const quoteIds = [];
  const failures = [];
  for (const type of ['buy', 'sell']) {
    await step(
      `${label}: partner ${type} order reaches completed`,
      async () => {
        const created = await client.rails.createQuote(null, {
          type,
          blockchain: wallet.blockchain,
          cryptoAsset: 'eth',
          fiatAsset: 'eur',
          walletAddress: wallet.address,
          ...(type === 'buy'
            ? { fiatAmount: process.env.NASH_NFR_BUY_FIAT_AMOUNT || '100.00' }
            : {
                cryptoAmount: process.env.NASH_NFR_SELL_CRYPTO_AMOUNT || '0.05',
                transferMethod: 'deposit'
              })
        });
        assert.strictEqual(created.environment, 'sandbox');
        const quote = created.quote;
        assert(quote.id, 'Created quote has no ID');
        assert(!quoteIds.includes(quote.id), 'Quotes must be distinct');
        quoteIds.push(quote.id);
        console.log(`${label} ${type} quote retained: ${quote.id}`);
        assert.strictEqual(quote.type, type);
        assert.strictEqual(quote.blockchain, wallet.blockchain);
        assert.strictEqual(
          normalizeAddress(quote.walletAddress),
          normalizeAddress(wallet.address)
        );
        assert.strictEqual(quote.status, 'pending_user_confirmation');

        const confirmed =
          type === 'buy'
            ? await client.rails.confirmBuy(null, quote.id, {})
            : await client.rails.confirmSell(null, quote.id, {
                paymentMethodId: (await verifyPayout()).id
              });
        assert.strictEqual(confirmed.environment, 'sandbox');
        checkConfirmed(confirmed.quote, quote, wallet.address);
        if (type === 'buy') {
          assert(
            confirmed.quote.bankDepositInstructions &&
              confirmed.quote.bankDepositInstructions.referenceCode,
            'Buy has no bank deposit instructions'
          );
        } else {
          const instructions = confirmed.quote.cryptoDepositInstructions;
          assert(
            instructions && instructions.destinationAddress,
            'Sell has no crypto deposit destination'
          );
          assert.notStrictEqual(
            normalizeAddress(instructions.destinationAddress),
            normalizeAddress(wallet.address),
            'Sell deposit destination must not be the origin wallet'
          );
        }
        const current = await client.rails.getQuote(null, quote.id);
        checkConfirmed(current.quote, quote, wallet.address);

        // Partner's own order: customer_id is null (act-as partner).
        await markPaid(e2eSetupUrl, partner.id, null, quote.id);
        // partner_orders_only lists only the partner account's own orders.
        await waitForCompleted(client, null, quote, {
          partner_orders_only: true,
          limit: 20
        });
      }
    ).catch(error => {
      const reason =
        error instanceof Nash.RailsApiError
          ? `Rails HTTP ${error.status} (${error.code || 'no code'}) - ${
              error.backendMessage
            }`
          : error.message;
      failures.push(`${label} ${type}: ${reason}`);
      console.error(`${label} ${type} quote: FAIL (${reason})`);
    });
  }
  assert.deepStrictEqual(failures, [], `${label}: buy and sell must complete`);
}

async function run() {
  const credentials = {
    apiKey: required('NASH_API_KEY'),
    secret: required('NASH_API_SECRET')
  };
  const e2eSetupUrl =
    process.env.NASH_E2E_SETUP_URL ||
    'https://app.arm-dev1.nash.io/api/e2e/account_setup';
  const client = new Nash.Client(...getClientArgs());
  const step = async (name, fn) => {
    await nextSigningSecond();
    try {
      const result = await fn();
      console.log(`${name}: PASS`);
      return result;
    } catch (error) {
      console.log(`${name}: FAIL`);
      if (error && typeof error === 'object' && !error.step) error.step = name;
      throw error;
    }
  };

  try {
    if (process.env.NASH_RAILS_ONLY === '1') {
      // ponytail: private fields match rails-kyc.js; use public Rails-only login if added.
      client.mode = Nash.ClientMode.MPC;
      client.requestCredentials = {
        apiKey: credentials.apiKey,
        requestKey: decodeApiSecret(credentials.secret).requestKey
      };
    } else {
      await client.login(credentials);
    }
    const partner = await client.rails.getPartner();
    assert.strictEqual(partner.environment, 'sandbox');
    assert(partner.id, 'Partner ID is missing');
    const ctx = { client, partner, e2eSetupUrl, step };

    const nashWallet = await step('discover partner Nash wallet', async () => {
      const listed = await client.rails.listWallets(null);
      assert.strictEqual(listed.environment, 'sandbox');
      const found = listed.wallets.find(
        item => item.type === 'nash' && item.blockchain === BLOCKCHAIN
      );
      assert(found, `Partner has no Nash ${BLOCKCHAIN} wallet`);
      return found;
    });
    await partnerOrders(ctx, nashWallet, 'nash wallet');
    const externalWallet = await step(
      'verify partner external EVM wallet ownership',
      async () => {
        const key = createECDH('secp256k1');
        key.generateKeys();
        const privateKey = Buffer.from(
          key.getPrivateKey('hex').padStart(64, '0'),
          'hex'
        );
        const address = `0x${keccak256(key.getPublicKey().slice(1)).slice(-40)}`;
        try {
          const challenge = await client.rails.createWalletChallenge(null, {
            blockchain: BLOCKCHAIN,
            address
          });
          assert.strictEqual(challenge.environment, 'sandbox');
          assert.strictEqual(challenge.blockchain, BLOCKCHAIN);
          assert.strictEqual(
            normalizeAddress(challenge.address),
            normalizeAddress(address)
          );
          const registered = await client.rails.registerWallet(null, {
            blockchain: BLOCKCHAIN,
            address,
            challenge: challenge.challenge,
            signature: signTypedData({
              privateKey,
              data: JSON.parse(challenge.challenge),
              version: SignTypedDataVersion.V4
            })
          });
          assert.strictEqual(registered.environment, 'sandbox');
          assert.strictEqual(registered.wallet.blockchain, BLOCKCHAIN);
          assert.strictEqual(
            normalizeAddress(registered.wallet.address),
            normalizeAddress(address)
          );
          const listed = await client.rails.listWallets(null);
          assert.strictEqual(listed.environment, 'sandbox');
          const stored = listed.wallets.find(
            item =>
              item.type === 'external' &&
              item.blockchain === BLOCKCHAIN &&
              item.address === registered.wallet.address
          );
          assert(stored, 'Verified external wallet is missing from partner wallets');
          return stored;
        } finally {
          // Sandbox funding is simulated; this wallet never sends real assets.
          privateKey.fill(0);
        }
      }
    );
    await partnerOrders(ctx, externalWallet, 'external wallet');
    console.log(
      'Partner buy and sell orders completed with Nash and external wallets.'
    );
  } finally {
    client.disconnect();
  }
}

run().catch(error => {
  console.error(formatError('Partner fiat-ramp integration', error));
  process.exitCode = 1;
});
