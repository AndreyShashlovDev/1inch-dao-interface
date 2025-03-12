export interface WalletError extends Error {
  code: number
}
export declare function isUserRejectError(error: WalletError): boolean
