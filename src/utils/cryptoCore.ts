import client from '@neon-exchange/crypto-core-ts'
import wasm from '@neon-exchange/crypto-core-ts/bin/nash.wasm'
import * as loader from './loader.js'

const initializeApiClient = async () => {
    const go = new loader.Go()
    const module = await WebAssembly.instantiate(wasm, go.importObject)
    go.run(module)
    return client
}

export const cryptoCorePromise = initializeApiClient()