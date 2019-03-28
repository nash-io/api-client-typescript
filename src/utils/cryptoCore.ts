import client from '@neon-exchange/crypto-core-ts'
const wasm = require('@neon-exchange/crypto-core-ts/bin/nash.wasm')
require('@neon-exchange/crypto-core-ts/bin/wasm_loader.js')

const go = new (window as any).Go()

const initializeApiClient = async () => {
    const { instance } = await WebAssembly.instantiate(wasm, go.importObject)
    go.run(instance)
    return client
}

export const apiClientPromise = initializeApiClient()