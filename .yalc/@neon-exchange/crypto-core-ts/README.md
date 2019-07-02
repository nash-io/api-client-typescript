# crypto-core-ts

Official API Client for the Nash decentralized exchange

```sh
yarn add @neon-exchange/crypto-core-ts
```

## Contributing

### Warning: `wasm_loader.js` is edited

We have made slight modifications to `wasm_loader.js` from what the Go authors have provided. Specifically, we have updated the environment check for Node, because it is unreliable when consumers are using Webpack.

When updating `wasm_loader.js` in the future, make sure that this change is propagated (unless the Go authors fix their version)!

### Commit guidelines

This project uses [standard-version](https://github.com/conventional-changelog/standard-version) to automatically handle versioning and generate changelogs. Thus, commits should follow the conventional commit format. Example: `feat(deriveHKDFKeysFromPassword): allow passing of salt as arg`.

Breaking changes should be marked in the commit body as `BREAKING CHANGE: description`. This will ensure that `standard-version` generates a new major version when releasing.

### Releasing

```sh
# check out branch with name matching new release version
git checkout -b [NEW_VERSION]

# generate the release commit
# IMPORTANT: do not rebase this commit or your tag will point at the wrong SHA
yarn prepare-release
# if you want to imperatively publish a version number, run the following instead
# yarn prepare-release --release-as a.b.c

# push and make PR
# be sure to do --follow-tags as this ensures the release is tagged properly
# on Github and for future releases
git push -u origin [NEW_VERSION] --follow-tags

# get PR approved and merged
# IMPORTANT: make sure you merge with a merge commit or your tag will be wrong

# publish -- you must be logged in to NPM and have 2FA enabled
npm publish
```

## Usage

### Browser

These setup instructions assume usage in a modern bundled Javascript project. Our strategy involves having Webpack compile the `.wasm` file as part of our bundle. This removes the need to separately vendor and `fetch()` the `.wasm` file.

First, add a `.wasm` loader. Note that we load the file as Javascript and parse it as a buffer, rather than using Webpack's built-in `type: 'webassembly/experimental'`. This is because Webpack's plugin is incompatible with `importObject`, which we rely on.

```sh
yarn add -D arraybuffer-loader
```

```javascript
// webpack.js - add to your loaders for both dev and prod configurations.

// We load the wasm as an uncompiled ArrayBuffer because the
// webassembly/experimental type outputs a format incompatible with
// WebAssembly.instantiate.
{
  test: /\.wasm$/,
  type: 'javascript/auto',
  loaders: ['arraybuffer-loader']
}
```

Next, we need to configure a global `go` object that is just an empty object. This is because the API client expects this global, and Webpack will complain if it doesn't exist. Later we will ensure the correct value of this global is populated.

```javascript
// webpack.js - add to your plugins for both dev and prod configurations.

// api-client-go uses a global variable named go. Import order needs to be
// set up such that the global exists before the WASM file is imported.
// However,
new webpack.DefinePlugin({
  go: {}
})
```

Finally, we need to set up an initialization script for the API client. In the future, we may add this to the current library by adding a Webpack configuration.

```javascript
// apiClient.ts
import client from 'crypto-core-ts'
import wasm from 'crypto-core-ts/bin/nash.wasm'
import 'crypto-core-ts/bin/wasm_loader.js'

const go = new (window as any).Go()

const initializeApiClient = async () => {
  const { instance } = await WebAssembly.instantiate(wasm, go.importObject)
  go.run(instance)
  return client
}

/*
  Usage: the client is initialized asynchronously on app start. Instead of
  importing the client directly from node_modules, import this promise and
  await it. That way, it is guaranteed the client is ready when needed.
 */
export const apiClientPromise = initializeApiClient()

// elsewhere
const client = await apiClientPromise
const hkdf = await client.deriveHKDFKeysFromPassword('hunter2', 'salt')
```

If using Typescript, you will need to create a `wasm.d.ts` file, as well as `yarn add -D @types/webassembly-js-api`.

### Browser (no Webpack)

You will have to use `WebAssembly.instantiateStreaming` to import the `.wasm` file instead of directly importing it.

```typescript
import client from 'crypto-core-ts'
import 'crypto-core-ts/bin/wasm_loader.js'

const go = new (window as any).Go()

export const initializeApiClient = async (): Promise<Record<string, any>> => {
  const { instance } = await WebAssembly.instantiateStreaming(
    fetch(`[PATH]/nash.wasm`),
    go.importObject
  )
  go.run(instance)
  return client
}
```

### Node

TBA

## Nash core functions

### initialize
Initializes a config object constructed from the given parameters

```javascript
const params = {
    chainIndices: {
      eth: 1,
      neo: 1
    },
    encryptionKey: 'f0dfbf6f8d2229bbed18778a44832a93364fb133e01057e673d11327528042ed',
    enginePubkey: 'f0dfbf6f8d2229bbed18778a44832a93364fb133e01057e673d11327528042ed',
    passphrase: 'hunter2',
    secretKey: 'eb13bb0e89102d64700906c7082f9472',
    secretNonce: 'f6783fe349320f71acc2ca79',
    secretTag: '7c8dc1020de77cd42dbbbb850f4335e8'
  }

const config = await core.initialize(params)
```

### deriveHKDFKeysFromPassword
Derives the `authentication` and `encryption` key from the given password

```javascript
const result = await core.deriveHKDFKeysFromPassword('hunter2', 'b0cd9948365b')
console.log(result.authenticationKey)
console.log(result.encryptionKey)
```

### decryptSecretKey
Decrypts the given cipher text

```javascript
const cipherText = 'eb13bb0e89102d64700906c7082f9472'
const encryptionKey = 'f0dfbf6f8d2229bbed18778a44832a93364fb133e01057e673d11327528042ed'
const nonce = 'f6783fe349320f71acc2ca79'
const tag = '7c8dc1020de77cd42dbbbb850f4335e8'
const decryptedSecretKey = await core.decryptSecretKey(encryptionKey, cipherText, nonce, tag)
```

### encryptSecretKey
Encrypts the given secret key

```javascript
const secret = '672aaa69df4a2f99c1df0947e91f527e'
const encryptionKey = 'f0dfbf6f8d2229bbed18778a44832a93364fb133e01057e673d11327528042ed'
const nonce = 'f6783fe349320f71acc2ca79'

const encryptResult = await core.encryptSecretKey(encryptionKey, secret, nonce)
console.log(encryptResult.encryptedSecretKey)
console.log(encryptResult.tag)
```

### newMasterSeedFromEntropy
Creates a new master seed from the given password and secret key (entropy)

```javascript
const password = 'hunter2'
const entropy = '672aaa69df4a2f99c1df0947e91f527e'
const masterSeed = await core.newMasterSeedFromEntropy(password, entropy)
```

### signPayload
Signs the given payload with the given config object.

In order to sign payloads you need to aquire a `config` object first by calling `initialize`

```javascript
const params = {
  chainIndices: {
    eth: 1,
    neo: 1
  },
  encryptionKey: 'f0dfbf6f8d2229bbed18778a44832a93364fb133e01057e673d11327528042ed',
  enginePubkey: 'f0dfbf6f8d2229bbed18778a44832a93364fb133e01057e673d11327528042ed',
  passphrase: 'hunter2',
  secretKey: 'eb13bb0e89102d64700906c7082f9472',
  secretNonce: 'f6783fe349320f71acc2ca79',
  secretTag: '7c8dc1020de77cd42dbbbb850f4335e8'
}

const config = await core.initialize(params)
const listOrderParams = createListOrdersParams()
const signature = core.signPayload(config, listOrderParams)
console.log(signature)
```
