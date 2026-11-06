// Run after building: node scripts/runtime-smoke.js
const assert = require('assert')
const { createHash } = require('crypto')
const { ECPair } = require('bitcoinjs-lib')
const { ec: EC } = require('elliptic')
const protocol = require('@neon-exchange/nash-protocol')
const { signRequest } = require('../build/main/client/requestSigning')
const { initializeMpcRuntime } = require('../build/main/client/mpcRuntime')

async function main() {
  const privateKey = '01'.repeat(32)
  const key = ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex'))
  const url = new URL('https://example.test/api/v1/customers?limit=20')
  const signature = signRequest(key, '1791907200', 'GET', url)
  const digest = createHash('sha256')
    .update('1791907200\nGET\n/api/v1/customers?limit=20\n\n\n').digest()
  assert(key.verify(digest, Buffer.from(signature, 'hex')))
  assert(!key.verify(createHash('sha256').update('changed').digest(), Buffer.from(signature, 'hex')))

  const words = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'.split(' ')
  assert.strictEqual(protocol.mnemonicToSecretKey(words).toString('hex'), '00'.repeat(16))
  assert.strictEqual(protocol.mnemonicToMasterSeed(words).toString('hex'),
    '5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4')

  initializeMpcRuntime()
  const signed = await protocol.sign(privateKey, digest.toString('hex'))
  const curve = new EC('secp256k1')
  assert(curve.keyFromPrivate(privateKey).verify(digest.toString('hex'), signed))
  console.log(`${process.version} ${process.platform}/${process.arch}: request signature, BIP-39 derivation, and protocol signature verified`)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
