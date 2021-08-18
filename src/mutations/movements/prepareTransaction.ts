import {
  SignedTransactionElement,
  Blockchain
} from '@neon-exchange/nash-protocol'
import gql from 'graphql-tag'

export const PREPARE_TRANSATION_MUTATION = gql`
  mutation prepareTransaction(
    $payload: PrepareTransactionParams!
    $signature: Signature!
  ) {
    prepareTransaction(payload: $payload, signature: $signature) {
      reference
      transaction {
        transactionFee {
          amount
          assetHash
          blockchain
        }
        transactionNonce
        transactionSpecific {
          ... on ApproveTransaction {
            minimumQuantity {
              amount
              assetHash
              blockchain
            }
            quantity {
              amount
              assetHash
              blockchain
            }
            targetAddress
          }
        }
      }
      transactionElements {
        blockchain
        payload
        payloadHash
        payloadHashFunction
        signatureFunction
      }
    }
  }
`

export const ITERATE_TRANSATION_MUTATION = gql`
  mutation iterateTransaction(
    $payload: IterateTransactionParams!
    $signature: Signature!
  ) {
    iterateTransaction(payload: $payload, signature: $signature) {
      transactionElements {
        blockchain
        payload
        payloadHash
        payloadHashFunction
        signatureFunction
      }
    }
  }
`

export interface AssetQuantity {
  amount: number
  assetHash: string
  blockchain: Blockchain
}

export enum ElementType {
  StateChannelBalance = 'STATE_CHANNEL_BALANCE',
  StateChannelDeposit = 'STATE_CHANNEL_DEPOSIT',
  StateChannelOrder = 'STATE_CHANNEL_ORDER',
  StateChannelWithdrawal = 'STATE_CHANNEL_WITHDRAWAL',
  Transaction = 'TRANSACTION'
}
/** A graphql representation of an amount of crypto or fiat currency. */
export interface InputAssetQuantity {
  amount: string
  assetHash: string
  blockchain: Blockchain
}

export interface InputApproveTransaction {
  minimumQuantity: InputAssetQuantity
  quantity: InputAssetQuantity
  targetAddress: string
}

export interface InputTransferTransaction {
  capQuantityToMaximum: boolean
  quantity: InputAssetQuantity
  targetAddress: string
}

export interface InputGenericTransaction {
  /**
   * List of balances to reserve for this transaction, eth balance can be part of
   * the list but should not include the amount specified in quantity nor the gas fee
   */
  balancesToReserve: ReadonlyArray<InputAssetQuantity>
  data: string
  /** gas limit for this transaction, if the amount is 0 it will be automatically derived */
  gas: number
  /** ETH Amount to be explicitly transfered with the transaction */
  quantity: InputAssetQuantity
  targetAddress: string
}

export interface ApproveTransaction {
  /** If the already approved amount is higher than this an error will be returned */
  minimumQuantity: AssetQuantity
  quantity: AssetQuantity
  targetAddress: string
}

export interface GenericTransaction {
  /** List of balances to reserve for this transaction */
  balancesToReserve: AssetQuantity[]
  data: string
  gas: number
  quantity: AssetQuantity
  targetAddress: string
}

export interface TransferTransaction {
  quantity: AssetQuantity
  targetAddress: string
}

export type UnionTransactionSpecific =
  | ApproveTransaction
  | GenericTransaction
  | TransferTransaction

export enum PayloadHashFunction {
  BtcSigHash = 'BTC_SIG_HASH',
  DoubleSha256 = 'DOUBLE_SHA256',
  Keccak_256 = 'KECCAK_256',
  Keccak_256EthPayload = 'KECCAK_256_ETH_PAYLOAD',
  Sha256 = 'SHA256'
}

export enum SignatureFunction {
  Secp256K1Compact = 'SECP256K1_COMPACT',
  Secp256K1Recoverable = 'SECP256K1_RECOVERABLE',
  Secp256R1 = 'SECP256R1'
}

export interface Transaction {
  transactionFee: AssetQuantity
  transactionNonce?: number
  transactionSpecific: UnionTransactionSpecific
}

export interface TransactionElement {
  blockchain: Blockchain
  digest: string
  elementType: ElementType
  payload: string
  payloadHash: string
  payloadHashFunction: PayloadHashFunction
  signatureFunction: SignatureFunction
}

export interface PrepareTransactionParams {
  address: string
  approve?: InputApproveTransaction
  blockchain: Blockchain
  gasPrice: number
  generic?: InputGenericTransaction
  timestamp: number
  transfer?: InputTransferTransaction
}

export interface PrepareTransactionResponse {
  reference: string
  transaction: Transaction
  transactionElements: TransactionElement[]
  approvalNeeded?: boolean
}

export interface IterateTransactionParams {
  reference: string
  signedTransactionElements: SignedTransactionElement[]
  timestamp: number
}

export interface IterateTransactionResponse {
  transactionElements: TransactionElement[]
}
