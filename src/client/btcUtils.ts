import { BigNumber } from 'bignumber.js'
import {
  networks,
  script as bscript,
  payments,
  crypto,
  Transaction
} from 'bitcoinjs-lib'
import coinSelect from 'coinselect'

import fetch from 'node-fetch'
import { PsbtInput } from 'bip174/src/lib/interfaces'
import { checkForInput } from 'bip174/src/lib/utils'

interface Output {
  script: Buffer
  value: number
}

export interface Utxos {
  txid: string
  vout: number
  value: string
  height: number
}
export const BTC_DIGITS = 8
export const BTC_SATOSHI_MULTIPLIER = Math.pow(10, BTC_DIGITS)
export const FAKE_DESTINATION = '16JrGhLx5bcBSA34kew9V6Mufa4aXhFe9X'
export const NORMAL_TO_SATOSHI_MULTIPLIER = new BigNumber(10).pow(8)

export const calculateBtcFees = (
  amount: number,
  gasPrice: number,
  utxos: Utxos[]
): BigNumber => {
  // since this is just used to format the tx to calculate the fee
  // there is no need for a real destination
  const transferAmount = Math.round(amount * BTC_SATOSHI_MULTIPLIER)

  // Calculate inputs and outputs using coin selection algorithm
  const { fee } = coinSelect(
    utxos.map(utxo => ({
      ...utxo,
      txId: utxo.txid,
      value: new BigNumber(utxo.value).times(BTC_SATOSHI_MULTIPLIER).toNumber()
    })),
    [{ address: FAKE_DESTINATION, value: transferAmount }],
    gasPrice
  )
  return new BigNumber(fee).div(NORMAL_TO_SATOSHI_MULTIPLIER)
}

export const calculateFeeRate = async (): Promise<number> => {
  const fees = await fetch(
    'https://bitcoinfees.earn.com/api/v1/fees/recommended'
  )
  const data = await fees.json()
  return data.fastestFee as number
}

export const networkFromName = (name: string) => {
  switch (name) {
    case 'TestNet':
      return networks.testnet
    case 'MainNet':
      return networks.bitcoin
    default:
      return networks.regtest
  }
}

function checkScriptForPubkey(
  pubkey: Buffer,
  script: Buffer,
  action: string
): void {
  const pubkeyHash = crypto.hash160(pubkey)

  const decompiled = bscript.decompile(script)
  if (decompiled === null) {
    throw new Error('Unknown script error')
  }

  const hasKey = decompiled.some(element => {
    if (typeof element === 'number') {
      return false
    }
    return element.equals(pubkey) || element.equals(pubkeyHash)
  })

  if (!hasKey) {
    throw new Error(
      `Can not ${action} for this input with the key ${pubkey.toString('hex')}`
    )
  }
}

export function getHashAndSighashType(
  inputs: PsbtInput[],
  inputIndex: number,
  pubkey: Buffer,
  cache: PsbtCache,
  sighashTypes: number[]
): {
  hash: Buffer
  sighashType: number
} {
  const input = checkForInput(inputs, inputIndex)
  const { hash, sighashType, script } = getHashForSig(
    inputIndex,
    input,
    cache,
    sighashTypes
  )
  checkScriptForPubkey(pubkey, script, 'sign')
  return {
    hash,
    sighashType
  }
}

interface PsbtCache {
  __NON_WITNESS_UTXO_TX_CACHE: Transaction[]
  __NON_WITNESS_UTXO_BUF_CACHE: Buffer[]
  __TX_IN_CACHE: { [index: string]: number }
  __TX: Transaction
  __FEE_RATE?: number
  __FEE?: number
  __EXTRACTED_TX?: Transaction
}

function sighashTypeToString(sighashType: number): string {
  let text = // tslint:disable-next-line
    sighashType & Transaction.SIGHASH_ANYONECANPAY
      ? 'SIGHASH_ANYONECANPAY | '
      : ''
  // tslint:disable-next-line
  const sigMod = sighashType & 0x1f
  switch (sigMod) {
    case Transaction.SIGHASH_ALL:
      text += 'SIGHASH_ALL'
      break
    case Transaction.SIGHASH_SINGLE:
      text += 'SIGHASH_SINGLE'
      break
    case Transaction.SIGHASH_NONE:
      text += 'SIGHASH_NONE'
      break
  }
  return text
}

function addNonWitnessTxCache(
  cache: PsbtCache,
  input: PsbtInput,
  inputIndex: number
): void {
  cache.__NON_WITNESS_UTXO_BUF_CACHE[inputIndex] = input.nonWitnessUtxo!

  const tx = Transaction.fromBuffer(input.nonWitnessUtxo!)
  cache.__NON_WITNESS_UTXO_TX_CACHE[inputIndex] = tx

  const self = cache
  const selfIndex = inputIndex
  delete input.nonWitnessUtxo
  Object.defineProperty(input, 'nonWitnessUtxo', {
    enumerable: true,
    get(): Buffer {
      const buf = self.__NON_WITNESS_UTXO_BUF_CACHE[selfIndex]
      const txCache = self.__NON_WITNESS_UTXO_TX_CACHE[selfIndex]
      if (buf !== undefined) {
        return buf
      } else {
        const newBuf = txCache.toBuffer()
        self.__NON_WITNESS_UTXO_BUF_CACHE[selfIndex] = newBuf
        return newBuf
      }
    },
    set(data: Buffer): void {
      self.__NON_WITNESS_UTXO_BUF_CACHE[selfIndex] = data
    }
  })
}

function nonWitnessUtxoTxFromCache(
  cache: PsbtCache,
  input: PsbtInput,
  inputIndex: number
): Transaction {
  const c = cache.__NON_WITNESS_UTXO_TX_CACHE
  if (!c[inputIndex]) {
    addNonWitnessTxCache(cache, input, inputIndex)
  }
  return c[inputIndex]
}

function scriptCheckerFactory(
  payment: any,
  paymentScriptName: string
): (idx: number, spk: Buffer, rs: Buffer) => void {
  return (
    inputIndex: number,
    scriptPubKey: Buffer,
    redeemScript: Buffer
  ): void => {
    const redeemScriptOutput = payment({
      redeem: { output: redeemScript }
    }).output as Buffer

    if (!scriptPubKey.equals(redeemScriptOutput)) {
      throw new Error(
        `${paymentScriptName} for input #${inputIndex} doesn't match the scriptPubKey in the prevout`
      )
    }
  }
}
const checkRedeemScript = scriptCheckerFactory(payments.p2sh, 'Redeem script')
const checkWitnessScript = scriptCheckerFactory(
  payments.p2wsh,
  'Witness script'
)

function isPaymentFactory(payment: any): (script: Buffer) => boolean {
  return (script: Buffer): boolean => {
    try {
      payment({ output: script })
      return true
    } catch (err) {
      return false
    }
  }
}
const isP2WPKH = isPaymentFactory(payments.p2wpkh)
const isP2WSHScript = isPaymentFactory(payments.p2wsh)

export function getHashForSig(
  inputIndex: number,
  input: PsbtInput,
  cache: PsbtCache,
  sighashTypes?: number[]
): {
  script: Buffer
  hash: Buffer
  sighashType: number
} {
  const unsignedTx = cache.__TX
  const sighashType = input.sighashType || Transaction.SIGHASH_ALL
  if (sighashTypes && sighashTypes.indexOf(sighashType) < 0) {
    const str = sighashTypeToString(sighashType)
    throw new Error(
      `Sighash type is not allowed. Retry the sign method passing the ` +
        `sighashTypes array of whitelisted types. Sighash type: ${str}`
    )
  }
  let hash: Buffer
  let script: Buffer

  if (input.nonWitnessUtxo) {
    const nonWitnessUtxoTx = nonWitnessUtxoTxFromCache(cache, input, inputIndex)

    const prevoutHash = unsignedTx.ins[inputIndex].hash
    const utxoHash = nonWitnessUtxoTx.getHash()

    // If a non-witness UTXO is provided, its hash must match the hash specified in the prevout
    if (!prevoutHash.equals(utxoHash)) {
      throw new Error(
        `Non-witness UTXO hash for input #${inputIndex} doesn't match the hash specified in the prevout`
      )
    }

    const prevoutIndex = unsignedTx.ins[inputIndex].index
    const prevout = nonWitnessUtxoTx.outs[prevoutIndex] as Output

    if (input.redeemScript) {
      // If a redeemScript is provided, the scriptPubKey must be for that redeemScript
      checkRedeemScript(inputIndex, prevout.script, input.redeemScript)
      script = input.redeemScript
    } else {
      script = prevout.script
    }

    if (isP2WSHScript(script)) {
      if (!input.witnessScript) {
        throw new Error('Segwit input needs witnessScript if not P2WPKH')
      }
      checkWitnessScript(inputIndex, script, input.witnessScript)
      hash = unsignedTx.hashForWitnessV0(
        inputIndex,
        input.witnessScript,
        prevout.value,
        sighashType
      )
      script = input.witnessScript
    } else if (isP2WPKH(script)) {
      // P2WPKH uses the P2PKH template for prevoutScript when signing
      const signingScript = payments.p2pkh({ hash: script.slice(2) }).output!
      hash = unsignedTx.hashForWitnessV0(
        inputIndex,
        signingScript,
        prevout.value,
        sighashType
      )
    } else {
      hash = unsignedTx.hashForSignature(inputIndex, script, sighashType)
    }
  } else if (input.witnessUtxo) {
    let _script: Buffer // so we don't shadow the `let script` above
    if (input.redeemScript) {
      // If a redeemScript is provided, the scriptPubKey must be for that redeemScript
      checkRedeemScript(
        inputIndex,
        input.witnessUtxo.script,
        input.redeemScript
      )
      _script = input.redeemScript
    } else {
      _script = input.witnessUtxo.script
    }
    if (isP2WPKH(_script)) {
      // P2WPKH uses the P2PKH template for prevoutScript when signing
      const signingScript = payments.p2pkh({ hash: _script.slice(2) }).output!
      hash = unsignedTx.hashForWitnessV0(
        inputIndex,
        signingScript,
        input.witnessUtxo.value,
        sighashType
      )
      script = _script
    } else if (isP2WSHScript(_script)) {
      if (!input.witnessScript) {
        throw new Error('Segwit input needs witnessScript if not P2WPKH')
      }
      checkWitnessScript(inputIndex, _script, input.witnessScript)
      hash = unsignedTx.hashForWitnessV0(
        inputIndex,
        input.witnessScript,
        input.witnessUtxo.value,
        sighashType
      )
      // want to make sure the script we return is the actual meaningful script
      script = input.witnessScript
    } else {
      throw new Error(
        `Input #${inputIndex} has witnessUtxo but non-segwit script: ` +
          `${_script.toString('hex')}`
      )
    }
  } else {
    throw new Error('Need a Utxo input item for signing')
  }
  return {
    script,
    sighashType,
    hash
  }
}
