'use strict';

// node --env-file=.env integration-tests/rails/rails-sell-nash-wallet-for-partner.js
// Sends sandbox BTC and ETH from the partner's funded Nash wallets. No simulated payment.
const assert = require('assert');
const {
  Blockchain,
  SigningPayloadID
} = require('@neon-exchange/nash-protocol');
const Nash = require('../../build/main');
const { decodeApiSecret } = require('../../build/main/client/requestSigning');
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

async function sell(client, config, paymentMethodId, scenario) {
  const { asset, blockchain, amount } = scenario;
  const transactionRequest = async (operation, body) => {
    try {
      return await client.rails[operation](body);
    } catch (error) {
      console.error(
        `${asset} ${operation} request payload:`,
        JSON.stringify(body, null, 2)
      );
      throw error;
    }
  };
  await nextSigningSecond();
  const listed = await client.rails.listWallets(null);
  assert.strictEqual(listed.environment, 'SANDBOX');
  const wallet = listed.wallets.find(
    item => item.type === 'NASH' && item.blockchain === blockchain
  );
  assert(wallet, `Partner has no Nash ${asset} wallet`);
  const { rates } = await client.rails.getAssetRates();
  const rate = rates.find(
    item => item.symbol === asset && item.blockchain === blockchain
  );
  assert(rate, `No asset rate for ${asset} on ${blockchain}`);
  const assetHash = rate.assetHash;
  const created = await client.rails.createQuote(null, {
    type: 'SELL',
    blockchain,
    cryptoAsset: asset,
    fiatAsset: 'eur',
    cryptoAmount: { amount, blockchain, assetHash },
    walletAddress: wallet.address,
    transferMethod: 'DEPOSIT'
  });
  assert.strictEqual(created.environment, 'SANDBOX');
  const quote = created.quote;
  assert(quote.id, 'Sell quote has no ID');
  console.log(`${asset} sell quote retained: ${quote.id}`);
  assert.strictEqual(quote.type, 'SELL');
  assert.strictEqual(quote.blockchain, blockchain);
  assert.strictEqual(quote.status, 'PENDING_USER_CONFIRMATION');
  const confirmed = await client.rails.confirmSell(null, quote.id, {
    paymentMethodId
  });
  assert.strictEqual(confirmed.environment, 'SANDBOX');
  checkConfirmed(confirmed.quote, quote, wallet.address);
  const instructions = confirmed.quote.cryptoDepositInstructions;
  assert(
    instructions && instructions.destinationAddress,
    'Sell has no deposit destination'
  );
  const targetAddress = instructions.destinationAddress;
  assert.notStrictEqual(
    normalizeAddress(targetAddress),
    normalizeAddress(wallet.address)
  );
  // cryptoAmount fixes the sell quantity; reuse its decimal request amount.
  assert(quote.cryptoAmount, 'Sell quote has no crypto amount');
  assert.strictEqual(
    confirmed.quote.cryptoAmount.amount,
    quote.cryptoAmount.amount,
    'Confirmation changed the fixed sell quantity'
  );
  const quantity = amount;

  const feeResponse = await client.rails.getBlockchainFees(blockchain);
  assert.strictEqual(feeResponse.environment, 'SANDBOX');
  const fees = feeResponse.blockchainFees;
  assert(fees && fees.priceMedium != null, 'Missing medium blockchain fee');
  // Fees arrive as exact decimal strings; the signed payload takes JSON numbers.
  const feeNumber = value => {
    if (value == null) return value;
    const number = Number(value);
    assert(
      Number.isSafeInteger(number),
      `Blockchain fee ${value} exceeds 2^53`
    );
    return number;
  };
  assert(
    Date.parse(confirmed.quote.transferUntil) > Date.now(),
    'Sell funding deadline passed'
  );
  const prepared = await transactionRequest(
    'prepareTransaction',
    await client.rails.signPayload({
      kind: SigningPayloadID.prepareTransactionPayload,
      payload: {
        timestamp: Date.now(),
        blockchain,
        address: wallet.address,
        gasPrice: feeNumber(fees.priceMedium),
        maxFeePerGas: feeNumber(fees.maxFeePerGasMedium),
        maxPriorityFeePerGas: feeNumber(fees.maxPriorityFeePerGasMedium),
        transfer: {
          quantity: { amount: quantity, assetHash, blockchain },
          targetAddress,
          capQuantityToMaximum: false
        }
      }
    })
  );
  assert.strictEqual(prepared.environment, 'SANDBOX');
  const reference = prepared.preparedTransaction.reference;
  assert(reference, 'Prepare returned no transaction reference');
  console.log(`${asset} transaction reference retained: ${reference}`);
  let transaction = prepared.preparedTransaction;
  const deadline = Date.now() + 120000;
  while (!transaction.transactionHash) {
    assert(Date.now() < deadline, 'Transaction iteration timed out');
    const elements = transaction.transactionElements;
    assert(
      Array.isArray(elements) && elements.length > 0,
      'Transaction has neither a hash nor signing elements'
    );
    // Pass only the fields the protocol presigner consumes.
    const transactionElements = elements.map(element => {
      assert.strictEqual(element.blockchain, blockchain);
      assert(element.payloadHash, 'Transaction element has no payload hash');
      return {
        blockchain: element.blockchain,
        payload: element.payload,
        payloadHash: element.payloadHash,
        payloadHashFunction: element.payloadHashFunction,
        signatureFunction: element.signatureFunction
      };
    });
    const body = await client.rails.signPayload({
      kind: SigningPayloadID.iterateTransactionPayload,
      payload: { timestamp: Date.now(), reference, transactionElements }
    });
    assert.strictEqual(
      body.payload.signedTransactionElements.length,
      elements.length
    );
    body.payload.signedTransactionElements.forEach(element => {
      assert(
        element.signature && element.r,
        'MPC presigning returned no signature or r'
      );
    });
    const iterated = await transactionRequest('iterateTransaction', body);
    assert.strictEqual(iterated.environment, 'SANDBOX');
    transaction = iterated.iteratedTransaction;
  }
  assert(
    blockchain === Blockchain.ETH
      ? /^0x[0-9a-f]{64}$/i.test(transaction.transactionHash)
      : /^(0x)?[0-9a-f]{64}$/i.test(transaction.transactionHash),
    'Iterate returned an invalid transaction hash'
  );
  console.log(
    `${asset} transaction broadcast: ${transaction.transactionHash}`
  );
  await waitForCompleted(
    client,
    null,
    quote,
    { partner_orders_only: true, limit: 20 },
    900000
  );
  console.log(
    `${asset} Nash-wallet sell: PASS (quote and order history completed)`
  );
}

async function run() {
  const apiKey = required('NASH_API_KEY');
  const { secret, requestKey } = decodeApiSecret(required('NASH_API_SECRET'));
  const args = getClientArgs();
  assert.strictEqual(
    process.env.NASH_ENV || 'sandbox',
    'sandbox',
    'Sandbox only'
  );
  const client = new Nash.Client(...args);
  // Rails-only MPC session; signing and pool initialization belong to the SDK.
  client.mode = Nash.ClientMode.MPC;
  const credentials = { apiKey, requestKey };
  client.requestCredentials = credentials;
  client.apiKey = secret;
  try {
    await nextSigningSecond();
    const partner = await client.rails.getPartner();
    assert.strictEqual(partner.environment, 'SANDBOX');
    const methods = await client.rails.listPaymentMethods(null);
    assert.strictEqual(methods.environment, 'SANDBOX');
    let payout = methods.paymentMethods.find(
      item =>
        item.type === 'EXTERNAL_BANK_ACCOUNT' && item.status === 'APPROVED'
    );
    if (!payout) {
      const verified = await client.rails.verifyBankAccount(null, {
        iban: process.env.NASH_NFR_IBAN || 'DE29100100100987654321'
      });
      assert.strictEqual(verified.environment, 'SANDBOX');
      assert.strictEqual(verified.status, 'APPROVED');
      payout = verified.paymentMethod;
    }
    const failures = [];
    for (const scenario of [
      {
        asset: 'btc',
        blockchain: Blockchain.BTC,
        amount: process.env.NASH_NFR_SELL_BTC_AMOUNT || '0.01'
      },
      {
        asset: 'eth',
        blockchain: Blockchain.ETH,
        amount: process.env.NASH_NFR_SELL_ETH_AMOUNT || '0.1'
      }
    ]) {
      try {
        await sell(client, args[0], payout.id, scenario);
      } catch (error) {
        failures.push(scenario.asset);
        console.error(formatError(`${scenario.asset} Nash-wallet sell`, error));
      }
    }
    assert.deepStrictEqual(
      failures,
      [],
      'Both BTC and ETH sells must complete'
    );
  } finally {
    client.disconnect();
  }
}

run().catch(error => {
  console.error(formatError('Partner Nash-wallet sell integration', error));
  process.exitCode = 1;
});
