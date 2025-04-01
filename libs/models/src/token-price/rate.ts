import type { ChainId } from '../chain'
import type { IToken } from '../token'

export type Rate = {
  chainId: ChainId
  isReverted: boolean
  rate: bigint
  revertedRate: bigint
  sourceToken: IToken
  destinationToken: IToken
}
