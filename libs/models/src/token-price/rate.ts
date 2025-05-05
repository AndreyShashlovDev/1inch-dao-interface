import type { IBigFloat } from '../big-float'
import type { ChainId } from '../chain'
import type { IToken } from '../token'

export type Rate = {
  chainId: ChainId
  isReverted: boolean
  rate: IBigFloat
  revertedRate: IBigFloat
  sourceToken: IToken
  destinationToken: IToken
}
