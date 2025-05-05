import type { IToken } from '../token'

export type Rate = {
  isReverted: boolean
  rate: bigint
  revertedRate: bigint
  sourceToken: IToken
  destinationToken: IToken
}
