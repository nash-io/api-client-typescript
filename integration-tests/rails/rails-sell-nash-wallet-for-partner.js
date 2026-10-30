'use strict';

// node --env-file=.env integration-tests/rails/rails-sell-nash-wallet-for-partner.js
// Sends sandbox BTC and ETH from the partner's funded Nash wallets. No simulated payment.
const assert = require('assert');
const {
  Blockchain,
  SigningPayloadID
} = require('@neon-exchange/nash-protocol');
const Nash = require('../../build/main');
const {
  authenticatedHeaders,
  decodeApiSecret
} = require('../../build/main/client/requestSigning');
const getClientArgs = require('./support/client-args');
const formatError = require('./support/format-error');
const {
  normalizeAddress,
  checkConfirmed,
  waitForCompleted
} = require('./support/fiat-ramp-helpers');

const required = name => {
  assert(process.env[name], `Set ${name}`);
  return process.env[name];
};
const nextSigningSecond = () =>
  new Promise(resolve => setTimeout(resolve, 1010 - (Date.now() % 1000)));

async function sell(client, config, credentials, paymentMethodId, scenario) {
  const { asset, blockchain, assetHash, amount } = scenario;
  const transactionRequest = async (operation, body) => {
    try {
      return await client.rails[operation](body);
    } catch (error) {
      console.error(`${asset} ${operation} request payload:`, JSON.stringify(body, null, 2));
      throw error;
    }
  };
  await nextSigningSecond();
  const listed = await client.rails.listWallets(null);
  assert.strictEqual(listed.environment, 'sandbox');
  const wallet = listed.wallets.find(item => item.type === 'nash' && item.blockchain === asset);
  assert(wallet, `Partner has no Nash ${asset} wallet`);
  const created = await client.rails.createQuote(null, {
    type: 'sell', blockchain: asset, cryptoAsset: asset, fiatAsset: 'eur',
    cryptoAmount: amount, walletAddress: wallet.address, transferMethod: 'deposit'
  });
  assert.strictEqual(created.environment, 'sandbox');
  const quote = created.quote;
  assert(quote.id, 'Sell quote has no ID');
  console.log(`${asset} sell quote retained: ${quote.id}`);
  assert.strictEqual(quote.type, 'sell');
  assert.strictEqual(quote.blockchain, asset);
  assert.strictEqual(quote.status, 'pending_user_confirmation');
  const confirmed = await client.rails.confirmSell(null, quote.id, { paymentMethodId });
  assert.strictEqual(confirmed.environment, 'sandbox');
  checkConfirmed(confirmed.quote, quote, wallet.address);
  const instructions = confirmed.quote.cryptoDepositInstructions;
  assert(instructions && instructions.destinationAddress, 'Sell has no deposit destination');
  const targetAddress = instructions.destinationAddress;
  assert.notStrictEqual(normalizeAddress(targetAddress), normalizeAddress(wallet.address));
  // cryptoAmount fixes the sell quantity; reuse its decimal request units, not raw response units.
  assert(quote.cryptoAmount, 'Sell quote has no crypto amount');
  assert.strictEqual(confirmed.quote.cryptoAmount, quote.cryptoAmount, 'Confirmation changed the fixed sell quantity');
  const quantity = amount;


  // The SDK has no public Rails fee reader; reuse its request signer for the documented GET.
  const feeUrl = new URL(`${config.railsApiUrl.replace(/\/$/, '')}/transactions/blockchain-fees`);
  feeUrl.searchParams.set('blockchain', blockchain);
  const response = await fetch(feeUrl, {
    headers: authenticatedHeaders(credentials, 'GET', feeUrl, '', '', {}, undefined, 'partner'),
    redirect: 'error', signal: AbortSignal.timeout(30000)
  });
  assert(response.ok, `${asset} blockchain-fees returned HTTP ${response.status}`);
  const feeResponse = await response.json();
  assert.strictEqual(feeResponse.environment, 'sandbox');
  const fees = feeResponse.getBlockchainFees;
  assert(fees && fees.priceMedium != null, 'Missing medium blockchain fee');
  assert(Date.parse(confirmed.quote.transferUntil) > Date.now(), 'Sell funding deadline passed');
  const prepared = await transactionRequest('prepareTransaction', await client.rails.signPayload({
    kind: SigningPayloadID.prepareTransactionPayload,
    payload: {
      timestamp: Date.now(), blockchain, address: wallet.address,
      gasPrice: fees.priceMedium,
      maxFeePerGas: fees.maxFeePerGasMedium,
      maxPriorityFeePerGas: fees.maxPriorityFeePerGasMedium,
      transfer: {
        quantity: { amount: quantity, assetHash, blockchain },
        targetAddress, capQuantityToMaximum: false
      }
    }
  }));
  assert.strictEqual(prepared.environment, 'sandbox');
  const reference = prepared.prepareTransaction.reference;
  assert(reference, 'Prepare returned no transaction reference');
  console.log(`${asset} transaction reference retained: ${reference}`);
  let transaction = prepared.prepareTransaction;
  const deadline = Date.now() + 120000;
  while (!transaction.transaction_hash) {
    assert(Date.now() < deadline, 'Transaction iteration timed out');
    const elements = transaction.transaction_elements;
    assert(Array.isArray(elements) && elements.length > 0, 'Transaction has neither a hash nor signing elements');
    // REST uses snake_case; the protocol presigner consumes GraphQL-style camelCase.
    const transactionElements = elements.map(element => {
      assert.strictEqual(element.blockchain, blockchain);
      assert(element.payload_hash, 'Transaction element has no payload hash');
      return {
        blockchain: element.blockchain, payload: element.payload,
        payloadHash: element.payload_hash, payloadHashFunction: element.payload_hash_function,
        signatureFunction: element.signature_function
      };
    });
    const body = await client.rails.signPayload({
      kind: SigningPayloadID.iterateTransactionPayload,
      payload: { timestamp: Date.now(), reference, transactionElements }
    });
    assert.strictEqual(body.payload.signedTransactionElements.length, elements.length);
    body.payload.signedTransactionElements.forEach(element => {
      assert(element.signature && element.r, 'MPC presigning returned no signature or r');
    });
    const iterated = await transactionRequest('iterateTransaction', body);
    assert.strictEqual(iterated.environment, 'sandbox');
    transaction = iterated.iterateTransaction;
  }
  assert(
    blockchain === Blockchain.ETH
      ? /^0x[0-9a-f]{64}$/i.test(transaction.transaction_hash)
      : /^(0x)?[0-9a-f]{64}$/i.test(transaction.transaction_hash),
    'Iterate returned an invalid transaction hash'
  );
  console.log(`${asset} transaction broadcast: ${transaction.transaction_hash}`);
  await waitForCompleted(client, null, quote, { partner_orders_only: true, limit: 100 }, 900000);
  console.log(`${asset} Nash-wallet sell: PASS (quote and order history completed)`);
}

async function run() {
  const apiKey = required('NASH_API_KEY');
  const { secret, requestKey } = decodeApiSecret(required('NASH_API_SECRET'));
  const args = getClientArgs();
  assert.strictEqual(process.env.NASH_ENV || 'sandbox', 'sandbox', 'Sandbox only');
  const client = new Nash.Client(...args);
  // Rails-only MPC session; signing and pool initialization belong to the SDK.
  client.mode = Nash.ClientMode.MPC;
  const credentials = { apiKey, requestKey };
  client.requestCredentials = credentials;
  client.apiKey = secret;
  try {
    await nextSigningSecond();
    const partner = await client.rails.getPartner();
    assert.strictEqual(partner.environment, 'sandbox');
    const methods = await client.rails.listPaymentMethods(null);
    assert.strictEqual(methods.environment, 'sandbox');
    let payout = methods.paymentMethods.find(item =>
      item.type === 'external_bank_account' && item.status === 'approved'
    );
    if (!payout) {
      const verified = await client.rails.verifyBankAccount(null, {
        iban: process.env.NASH_NFR_IBAN || 'DE29100100100987654321'
      });
      assert.strictEqual(verified.environment, 'sandbox');
      assert.strictEqual(verified.status, 'approved');
      payout = verified.paymentMethod;
    }
    const failures = [];
    for (const scenario of [
      { asset: 'btc', blockchain: Blockchain.BTC,
        assetHash: '00',
        amount: process.env.NASH_NFR_SELL_BTC_AMOUNT || '0.1' },
      { asset: 'eth', blockchain: Blockchain.ETH,
        assetHash: '0000000000000000000000000000000000000000',
        amount: process.env.NASH_NFR_SELL_ETH_AMOUNT || '0.1' }
    ]) {
      try {
        await sell(client, args[0], credentials, payout.id, scenario);
      } catch (error) {
        failures.push(scenario.asset);
        console.error(formatError(`${scenario.asset} Nash-wallet sell`, error));
      }
    }
    assert.deepStrictEqual(failures, [], 'Both BTC and ETH sells must complete');
  } finally {
    client.disconnect();
  }
}

run().catch(error => {
  console.error(formatError('Partner Nash-wallet sell integration', error));
  process.exitCode = 1;
});
