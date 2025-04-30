import type { ChainId } from '../chain'
import type { IToken } from '../token'

export type Rate = {
  sourceChainId: ChainId
  destinationChainId: ChainId
  isReverted: boolean
  rate: bigint
  revertedRate: bigint
  sourceToken: IToken
  destinationToken: IToken
}
