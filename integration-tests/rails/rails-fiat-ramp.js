'use strict';

// yarn build
// node --env-file=.env integration-tests/rails/rails-fiat-ramp.js
// Sandbox only. Creates one customer and requires completed buy and sell orders.

const assert = require('assert');
const { createECDH } = require('crypto');
const { keccak256 } = require('web3-utils');
const {
  signTypedData,
  SignTypedDataVersion
} = require('@metamask/eth-sig-util');
const Nash = require('../../build/main');
const onboardCustomer = require('./rails-kyc');
const formatError = require('./support/format-error');

const {
  normalizeAddress,
  checkConfirmed,
  markPaid,
  quoteAmounts,
  waitForCompleted
} = require('./support/fiat-ramp-helpers');

async function fiatRamp({ client, customer, partner, e2eSetupUrl, step }) {
  const id = customer.id;
  const blockchain = 'ETH';
  const walletKey = createECDH('secp256k1');
  walletKey.generateKeys();
  const privateKey = Buffer.from(
    walletKey.getPrivateKey('hex').padStart(64, '0'),
    'hex'
  );
  const address = `0x${keccak256(walletKey.getPublicKey().slice(1)).slice(
    -40
  )}`;
  const wallet = await step(
    'verify external EVM wallet ownership',
    async () => {
      const available = await client.rails.listBlockchains();
      assert.strictEqual(available.environment, 'SANDBOX');
      assert(
        available.blockchains.includes(blockchain),
        'ETH wallet verification is unavailable'
      );
      const challenge = await client.rails.createWalletChallenge(id, {
        blockchain,
        address
      });
      assert.strictEqual(challenge.environment, 'SANDBOX');
      assert.strictEqual(challenge.blockchain, blockchain);
      assert.strictEqual(
        normalizeAddress(challenge.address),
        normalizeAddress(address)
      );
      const signature = signTypedData({
        privateKey,
        data: JSON.parse(challenge.challenge),
        version: SignTypedDataVersion.V4
      });
      const registered = await client.rails.registerWallet(id, {
        blockchain,
        address,
        signature,
        challenge: challenge.challenge
      });
      assert.strictEqual(registered.environment, 'SANDBOX');
      assert.strictEqual(registered.wallet.blockchain, blockchain);
      assert.strictEqual(
        normalizeAddress(registered.wallet.address),
        normalizeAddress(address)
      );
      const stored = await client.rails.listWallets(id);
      assert.strictEqual(stored.environment, 'SANDBOX');
      assert(
        stored.wallets.some(
          item =>
            item.type === 'EXTERNAL' &&
            item.blockchain === blockchain &&
            item.address === registered.wallet.address
        ),
        'Verified external wallet is missing from customer wallets'
      );
      return registered.wallet;
    }
  );
  // Only the sandbox E2E endpoint simulates funding; never send real assets.
  privateKey.fill(0);

  const paymentMethod = await step(
    'verify payout bank account and require approval',
    async () => {
      const verified = await client.rails.verifyBankAccount(id, {
        iban: process.env.NASH_NFR_IBAN || 'DE29100100100987654321'
      });
      assert.strictEqual(verified.environment, 'SANDBOX');
      assert.strictEqual(
        verified.status,
        'APPROVED',
        `Sandbox IBAN verification needs attention: ${verified.status}`
      );
      assert.strictEqual(verified.paymentMethod.status, 'APPROVED');
      assert(verified.paymentMethod.id, 'Approved payment method has no ID');
      const listed = await client.rails.listPaymentMethods(id);
      assert.strictEqual(listed.environment, 'SANDBOX');
      const stored = listed.paymentMethods.find(
        item => item.id === verified.paymentMethod.id
      );
      assert(stored, 'Approved payout account is missing from payment methods');
      assert.strictEqual(stored.status, 'APPROVED');
      assert.strictEqual(stored.type, verified.paymentMethod.type);
      return stored;
    }
  );

  const quoteIds = [];
  const failures = [];
  for (const type of ['BUY', 'SELL']) {
    await step(`${type} order reaches completed`, async () => {
      const created = await client.rails.createQuote(id, {
        type,
        blockchain: wallet.blockchain,
        cryptoAsset: 'eth',
        fiatAsset: 'eur',
        walletAddress: wallet.address,
        ...(await quoteAmounts(client, type, {
          symbol: 'eth',
          blockchain: wallet.blockchain
        })),
        ...(type === 'SELL' ? { transferMethod: 'DEPOSIT' } : {})
      });
      assert.strictEqual(created.environment, 'SANDBOX');
      const quote = created.quote;
      assert(quote.id, 'Created quote has no ID');
      assert(
        !quoteIds.includes(quote.id),
        'Buy and sell must create distinct quotes'
      );
      quoteIds.push(quote.id);
      console.log(`${type} quote retained: ${quote.id}`);
      assert.strictEqual(quote.type, type);
      assert.strictEqual(quote.blockchain, wallet.blockchain);
      assert.strictEqual(quote.fiatAsset, 'eur');
      assert.strictEqual(
        normalizeAddress(quote.walletAddress),
        normalizeAddress(wallet.address)
      );
      assert.strictEqual(
        quote.transferMethod,
        type === 'SELL' ? 'DEPOSIT' : null
      );
      assert.strictEqual(quote.permitTransferDigest, null);
      assert.strictEqual(quote.status, 'PENDING_USER_CONFIRMATION');
      assert(
        Date.parse(quote.confirmUntil) > Date.now(),
        'Quote confirmation deadline has passed'
      );
      const confirmed =
        type === 'BUY'
          ? await client.rails.confirmBuy(id, quote.id, {})
          : await client.rails.confirmSell(id, quote.id, {
              paymentMethodId: paymentMethod.id
            });
      assert.strictEqual(confirmed.environment, 'SANDBOX');
      checkConfirmed(confirmed.quote, quote, wallet.address);
      if (type === 'BUY') {
        const instructions = confirmed.quote.bankDepositInstructions;
        assert(instructions, 'Buy has no bank deposit instructions');
        assert(instructions.recipientName, 'Buy has no bank recipient');
        assert(instructions.referenceCode, 'Buy has no payment reference');
        assert(
          instructions.iban ||
            (instructions.accountNumber && instructions.sortCode),
          'Buy has no bank destination'
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
      const current = await client.rails.getQuote(id, quote.id);
      assert.strictEqual(current.environment, 'SANDBOX');
      checkConfirmed(current.quote, quote, wallet.address);
      await markPaid(e2eSetupUrl, partner.id, id, quote.id);
      await waitForCompleted(client, id, quote, {
        customer_id: id,
        limit: 20
      });
    }).catch(error => {
      const reason =
        error instanceof Nash.RailsApiError
          ? `Rails HTTP ${error.status} (${error.code || 'no code'}) - ${
              error.backendMessage
            }`
          : error.message;
      failures.push(`${type}: ${reason}`);
      console.error(`${type} quote: FAIL (${reason})`);
    });
  }
  assert.deepStrictEqual(
    failures,
    [],
    'Both buy and sell orders must complete'
  );
  console.log(
    'Buy and sell orders completed and reconciled through SDK order history.'
  );
}

onboardCustomer(fiatRamp).catch(error => {
  console.error(formatError('Fiat-ramp integration', error));
  process.exitCode = 1;
});
