import fs from 'fs';
import client from '@neon-exchange/crypto-core-ts';
require('@neon-exchange/crypto-core-ts/bin/wasm_loader.js');

const globalAny: any = global;

export async function initializeCryptoCore(): Promise<any> {
  const go = new globalAny.Go();

  const buffer = fs.readFileSync(
    'node_modules/@neon-exchange/crypto-core-ts/bin/nash.wasm'
  );
  const module = await WebAssembly.instantiate(buffer, go.importObject);
  go.run(module.instance);
  return client;
}
