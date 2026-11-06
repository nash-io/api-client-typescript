'use strict';

const assert = require('assert');

const normalizeAddress = address => address.toLowerCase().replace(/^0x/, '');

function checkConfirmed(current, created, address) {
  assert.strictEqual(current.id, created.id);
  assert.strictEqual(current.type, created.type);
  assert.strictEqual(current.blockchain, created.blockchain);
  assert.strictEqual(current.status, 'CONFIRMED_WAITING_FOR_PAYMENT');
  assert.strictEqual(
    normalizeAddress(current.walletAddress),
    normalizeAddress(address)
  );
  assert(
    Date.parse(current.transferUntil) > Date.now(),
    'Quote funding deadline has passed'
  );
}

// Sandbox E2E endpoint simulates the bank/crypto payment; never sends real assets.
async function markPaid(url, partnerId, customerId, quoteId) {
  const { default: fetch } = await import('node-fetch');
  const AbortController = require('abort-controller');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flow: 'mark_fiat_ramp_order_as_paid',
        partner_id: partnerId,
        customer_id: customerId,
        quote_id: quoteId
      }),
      redirect: 'error',
      signal: controller.signal
    });
    assert(
      response.ok,
      `mark_fiat_ramp_order_as_paid returned HTTP ${response.status}`
    );
    await response.text();
  } finally {
    clearTimeout(timer);
  }
}

// customerId null acts as the partner; ordersFilter narrows GET /orders.
async function waitForCompleted(client, customerId, created, ordersFilter, timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs;
  let status;
  let orderStatus = 'not listed';
  do {
    // Space signed reads to avoid replay detection within a timestamp second.
    await new Promise(resolve => setTimeout(resolve, 2000));
    const current = await client.rails.getQuote(customerId, created.id);
    assert.strictEqual(current.environment, 'SANDBOX');
    assert.strictEqual(current.quote.id, created.id);
    assert.strictEqual(current.quote.type, created.type);
    status = current.quote.status;
    assert(
      !/^(FAILED_|CANCELLED_|REJECTED_|PENDING_REFUND$|REFUNDED$|RECONFIRMATION_EXPIRED$)/.test(
        status
      ),
      `${created.type} quote ${created.id} entered unsuccessful state ${status}`
    );
    if (status === 'PENDING_USER_RATE_RECONFIRMATION') {
      assert(
        Date.parse(current.quote.reconfirmUntil) > Date.now(),
        'Rate reconfirmation deadline has passed'
      );
      const reconfirmed = await client.rails.reconfirmQuote(
        customerId,
        created.id
      );
      assert.strictEqual(reconfirmed.environment, 'SANDBOX');
      assert.strictEqual(reconfirmed.quote.id, created.id);
    }
    if (status === 'COMPLETED') {
      const history = await client.rails.listOrders(ordersFilter);
      assert.strictEqual(history.environment, 'SANDBOX');
      const order = history.orders.find(item => item.id === created.id);
      orderStatus = order ? order.status : 'not listed';
      if (orderStatus === 'COMPLETED') return;
    }
  } while (Date.now() < deadline);
  assert.fail(
    `${created.type} order ${
      created.id
    } did not complete: quote=${status}, history=${orderStatus}`
  );
}

// Quote request amounts: buys fix fiat, sells fix a crypto quantity whose assetHash
// comes from GET /asset-rates (matched by symbol and blockchain).
async function quoteAmounts(client, type, { symbol, blockchain }) {
  if (type === 'BUY') {
    return {
      fiatAmount: {
        amount: process.env.NASH_NFR_BUY_FIAT_AMOUNT || '100.00',
        currency: 'eur'
      }
    };
  }
  const { rates } = await client.rails.getAssetRates();
  const rate = rates.find(
    item => item.symbol === symbol && item.blockchain === blockchain
  );
  assert(rate, `No asset rate for ${symbol} on ${blockchain}`);
  return {
    cryptoAmount: {
      amount: process.env.NASH_NFR_SELL_CRYPTO_AMOUNT || '0.1',
      blockchain,
      assetHash: rate.assetHash
    }
  };
}

module.exports = {
  normalizeAddress,
  checkConfirmed,
  markPaid,
  quoteAmounts,
  waitForCompleted
};
