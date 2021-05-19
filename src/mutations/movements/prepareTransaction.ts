import gql from 'graphql-tag'

import {
  CurrencyAmount,
  Blockchain,
  Signature,
} from '../../types'

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


export type ApproveTransaction = {
  readonly quantity: CurrencyAmount
  readonly targetAddress: string
}


export type CompleteStakeTransaction = {
  readonly stakeId: string
}

export type CreateStakeTransaction = {
  readonly duration: number
  readonly quantity: CurrencyAmount
}

export type DepositTransaction = {
  readonly assetNonce: number
  readonly quantity: CurrencyAmount
}

export type GasClaimTransaction = {
  readonly placeholder?: string
}


export type NexSwapTransaction = {
  readonly quantity: CurrencyAmount
}


export type TransferTransaction = {
  readonly quantity: CurrencyAmount
  readonly targetAddress: string
}

export type WithdrawalTransaction = {
  readonly assetNonce: number
  readonly quantity: CurrencyAmount
}

export type UnionTransactionSpecific = ApproveTransaction | CompleteStakeTransaction | CreateStakeTransaction | DepositTransaction | GasClaimTransaction | NexSwapTransaction | TransferTransaction | WithdrawalTransaction


export interface TransactionElement {
  blockchain: Blockchain
  digest: string
  payload: string
  payloadHash: string
  payloadHashFunction: string
  signatureFunction: string
}

export type Transaction = {
  readonly transactionFee: CurrencyAmount
  readonly transactionNonce?: number
  readonly transactionSpecific: UnionTransactionSpecific
}

export type InputApproveTransaction = {
  quantity: CurrencyAmount
  targetAddress: String
}

export type InputCompleteStakeTransaction = {
  stakeId: String
}

export type InputCreateStakeTransaction = {
  duration: number
  quantity: CurrencyAmount
}

export type InputDepositTransaction = {
  capQuantityToMaximum: boolean
  quantity: CurrencyAmount
}

export type InputGasClaimTransaction = {
  /** Object does not have any field, this is a dummy to adhere to graphql standard */
  placeholder?: String
}

export type InputNexSwapTransaction = {
  quantity: CurrencyAmount
}


export type InputServerSignedState = {
  blockchain: Blockchain
  message: string
}

export type InputTransferTransaction = {
  capQuantityToMaximum: boolean
  quantity: CurrencyAmount
  targetAddress: string
}

export type InputWithdrawalTransaction = {
  capQuantityToMaximum: boolean
  quantity: CurrencyAmount
}

export type PrepareTransactionParams = {
  payload: {
    address: String
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

export type PrepareTransactionData = {
  prepareTransaction: PrepareTransaction
}

export type PrepareTransaction = {
  reference: string
  transaction: Transaction
  transactionElements: TransactionElement[]
}


export type SignedTransactionElement = {
  readonly blockchain: Blockchain
  readonly payloadHash: string
  readonly r: string
  readonly signature: string
}


export type IterateTransactionParams = {
  payload: {
    signedTransactionElements: SignedTransactionElement[]
    reference: string
    timestamp: number
  }
  signature: Signature
}

export type IterateTransactionData = {
  iterateTransaction: IterateTransaction
}

export type IterateTransaction = {
  transactionElements: TransactionElement[]
}
