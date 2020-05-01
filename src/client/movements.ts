export enum BlockchainError {
  BLOCKCHAIN_BALANCE_OUT_OF_SYNC = 'Blockchain balance out of sync',
  WAITING_FOR_BALANCE_SYNC = 'Waiting for balance sync',
  BAD_NONCE = 'Supplied nonce does not match expected nonce',
  MISSING_SIGNATURES = 'Missing signatures for open orders',
  INSUFFICIENT_BALANCE = 'Balance is insufficient',
  WAITING_FOR_BLOCKCHAIN_TRANSACTION = 'waiting for a transaction to make it to the blockchain',
  INVALID_SIGNATURE = 'Signature validation failed',
  MOVEMENT_ALREADY_IN_PROGRESS = 'A movement targeting the same asset is still in progress'
}
