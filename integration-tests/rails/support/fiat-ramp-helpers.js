'use strict';

const assert = require('assert');

const normalizeAddress = address => address.toLowerCase().replace(/^0x/, '');

function checkConfirmed(current, created, address) {
  assert.strictEqual(current.id, created.id);
  assert.strictEqual(current.type, created.type);
  assert.strictEqual(current.blockchain, created.blockchain);
  assert.strictEqual(current.status, 'confirmed_waiting_for_payment');
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
async function waitForCompleted(client, customerId, created, ordersFilter) {
  const deadline = Date.now() + 120000;
  let status;
  let orderStatus = 'not listed';
  do {
    // Space signed reads to avoid replay detection within a timestamp second.
    await new Promise(resolve => setTimeout(resolve, 2000));
    const current = await client.rails.getQuote(customerId, created.id);
    assert.strictEqual(current.environment, 'sandbox');
    assert.strictEqual(current.quote.id, created.id);
    assert.strictEqual(current.quote.type, created.type);
    status = current.quote.status;
    assert(
      !/^(failed_|cancelled_|rejected_|pending_refund$|refunded$|reconfirmation_expired$)/.test(
        status
      ),
      `${created.type} quote ${created.id} entered unsuccessful state ${status}`
    );
    if (status === 'pending_user_rate_reconfirmation') {
      assert(
        Date.parse(current.quote.reconfirmUntil) > Date.now(),
        'Rate reconfirmation deadline has passed'
      );
      const reconfirmed = await client.rails.reconfirmQuote(
        customerId,
        created.id
      );
      assert.strictEqual(reconfirmed.environment, 'sandbox');
      assert.strictEqual(reconfirmed.quote.id, created.id);
    }
    if (status === 'completed') {
      const history = await client.rails.listOrders(ordersFilter);
      assert.strictEqual(history.environment, 'sandbox');
      const order = history.orders.find(item => item.id === created.id);
      orderStatus = order ? order.status : 'not listed';
      if (orderStatus === 'completed') return;
    }
  } while (Date.now() < deadline);
  assert.fail(
    `${created.type} order ${
      created.id
    } did not complete: quote=${status}, history=${orderStatus}`
  );
}

module.exports = {
  normalizeAddress,
  checkConfirmed,
  markPaid,
  waitForCompleted
};
