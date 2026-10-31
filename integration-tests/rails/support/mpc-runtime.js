'use strict';

// Offline regression check for the SDK's MPC runtime initialization (build first).
const assert = require('assert');
const { initializeMpcRuntime } = require('../../../build/main/client/mpcRuntime');

if (require.main === module) {
  initializeMpcRuntime();
  const runtime = require('@neon-exchange/nash-protocol/build/main/mpc-lib');
  const { ECPair } = require('bitcoinjs-lib');
  const [ok, secrets, publics] = JSON.parse(runtime.dh_init(1, 'Secp256k1'));
  assert.strictEqual(ok, true, 'MPC DH initialization failed');
  const key = Buffer.from(secrets[0].padStart(64, '0'), 'hex');
  assert.strictEqual(ECPair.fromPrivateKey(key).publicKey.toString('hex'), publics[0]);
  key.fill(0);
  const [invalidCurveAccepted] = JSON.parse(runtime.get_rpool_size('invalid'));
  assert.strictEqual(invalidCurveAccepted, false, 'Invalid curves must be rejected');
  require('@neon-exchange/nash-protocol').getDhPoolSize({ blockchain: 'ETH' })
    .then(size => {
      assert.strictEqual(size, 0, 'DH initialization must not populate the signing pool');
      console.log('MPC runtime check: PASS (protocol loader, real DH key pair, invalid curve rejection)');
    })
    .catch(error => {
      console.error(error);
      process.exitCode = 1;
    });
}
