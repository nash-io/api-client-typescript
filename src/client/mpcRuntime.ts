import Module from 'module'

let initialized = false

/** Initialize the protocol runtime lazily, before its first MPC operation. */
export function initializeMpcRuntime(): void {
  if (initialized) {
    return
  }
  const runtimePath = require.resolve('@neon-exchange/nash-protocol/build/main/mpc-lib')
  if (process.platform === 'darwin' && process.arch === 'arm64' && !require.cache[runtimePath]) {
    // ponytail: protocol 4.12.2 lacks macOS ARM64 support; remove when upstream supports it.
    const wasm = require('@neon-exchange/nash-protocol/build/main/wasm')
    const replacement = new Module(runtimePath, module)
    replacement.filename = runtimePath
    replacement.exports = {
      ...wasm,
      dh_init: (size: number, curve: string) => wasm.dh_init(size, JSON.stringify(curve)),
      get_rpool_size: (curve: string) => wasm.get_rpool_size(JSON.stringify(curve)),
      fill_rpool: (secrets: string, publics: string, curve: string, pk: string) =>
        wasm.fill_rpool(secrets, publics, JSON.stringify(curve), pk),
      compute_presig: (key: string, hash: string, curve: string) =>
        wasm.compute_presig(key, hash, JSON.stringify(curve))
    }
    replacement.loaded = true
    require.cache[runtimePath] = replacement
  }
  const runtime = require(runtimePath)
  const [ok, sizeOrError] = JSON.parse(runtime.get_rpool_size('Secp256k1'))
  if (ok !== true) {
    throw new Error(`MPC runtime initialization failed: ${sizeOrError}`)
  }
  initialized = true
}
