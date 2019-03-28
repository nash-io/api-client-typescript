import fs from 'fs'
import client from '@neon-exchange/crypto-core-ts'
import * as loader from './loader.js'

const initializeApiClient = async () => {
    const go = new loader.Go()
    // This is just a temporary location for the wasm file till the imports and 
    // setup is cleaned up and optimized.
    const buffer = fs.readFileSync('nash.wasm')
    const module = await WebAssembly.instantiate(buffer, go.importObject)
    go.run(module.instance)
    return client
}

export const cryptoCorePromise = initializeApiClient()