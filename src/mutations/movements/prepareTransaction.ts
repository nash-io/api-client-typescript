import gql from 'graphql-tag'

import { CurrencyAmount, Blockchain, Signature } from '../../types'

export const PREPARE_TRANSACTION_MUTATION = gql`
  mutation prepareTransaction(
    $payload: PrepareTransactionParams!
    $signature: Signature!
  ) {
    prepareTransaction(payload: $payload, signature: $signature) {
      reference
      transactionElements {
        blockchain
        payload
        payloadHash
        payloadHashFunction
        signatureFunction
      }

      transaction {
        transactionFee {
          currency
          amount
        }
        transactionNonce
        transactionSpecific {
          ... on ApproveTransaction {
            quantity {
              currency
              amount
            }
            targetAddress
          }
        }
      }
    }
  }
`

export const ITERATE_TRANSACTION_MUTATION = gql`
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

export interface ApproveTransaction {
  readonly quantity: CurrencyAmount
  readonly targetAddress: string
}

export interface CompleteStakeTransaction {
  readonly stakeId: string
}

export interface CreateStakeTransaction {
  readonly duration: number
  readonly quantity: CurrencyAmount
}

export interface DepositTransaction {
  readonly assetNonce: number
  readonly quantity: CurrencyAmount
}

export interface GasClaimTransaction {
  readonly placeholder?: string
}

export interface NexSwapTransaction {
  readonly quantity: CurrencyAmount
}

export interface TransferTransaction {
  readonly quantity: CurrencyAmount
  readonly targetAddress: string
}

export interface WithdrawalTransaction {
  readonly assetNonce: number
  readonly quantity: CurrencyAmount
}

export type UnionTransactionSpecific =
  | ApproveTransaction
  | CompleteStakeTransaction
  | CreateStakeTransaction
  | DepositTransaction
  | GasClaimTransaction
  | NexSwapTransaction
  | TransferTransaction
  | WithdrawalTransaction

export interface TransactionElement {
  blockchain: Blockchain
  digest: string
  payload: string
  payloadHash: string
  payloadHashFunction: string
  signatureFunction: string
}

export interface Transaction {
  readonly transactionFee: CurrencyAmount
  readonly transactionNonce?: number
  readonly transactionSpecific: UnionTransactionSpecific
}

export interface InputApproveTransaction {
  quantity: CurrencyAmount
  targetAddress: string
}

export interface InputCompleteStakeTransaction {
  stakeId: string
}

export interface InputCreateStakeTransaction {
  duration: number
  quantity: CurrencyAmount
}

export interface InputDepositTransaction {
  capQuantityToMaximum: boolean
  quantity: CurrencyAmount
}

export interface InputGasClaimTransaction {
  /** Object does not have any field, this is a dummy to adhere to graphql standard */
  placeholder?: string
}

export interface InputNexSwapTransaction {
  quantity: CurrencyAmount
}

export interface InputServerSignedState {
  blockchain: Blockchain
  message: string
}

export interface InputTransferTransaction {
  capQuantityToMaximum: boolean
  quantity: CurrencyAmount
  targetAddress: string
}

export interface InputWithdrawalTransaction {
  capQuantityToMaximum: boolean
  quantity: CurrencyAmount
}

export interface PrepareTransactionParams {
  payload: {
    address: string
    approve?: InputApproveTransaction
    blockchain: Blockchain
    completeStake?: InputCompleteStakeTransaction
    createStake?: InputCreateStakeTransaction
    deposit?: InputDepositTransaction
    gasClaim?: InputGasClaimTransaction
    gasPrice: number
    nexSwap?: InputNexSwapTransaction
    timestamp: number
    transfer?: InputTransferTransaction
    withdrawal?: InputWithdrawalTransaction
  }
  signature: Signature
}

export interface PrepareTransactionData {
  prepareTransaction: PrepareTransaction
}

export interface PrepareTransaction {
  reference: string
  transaction: Transaction
  transactionElements: TransactionElement[]
}

export interface SignedTransactionElement {
  readonly blockchain: Blockchain
  readonly payloadHash: string
  readonly r: string
  readonly signature: string
}

export interface IterateTransactionParams {
  payload: {
    signedTransactionElements: SignedTransactionElement[]
    reference: string
    timestamp: number
  }
  signature: Signature
}

export interface IterateTransactionData {
  iterateTransaction: IterateTransaction
}

export interface IterateTransaction {
  transactionElements: TransactionElement[]
}
