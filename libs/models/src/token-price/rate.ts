import { ChainId } from '../chain'
import { IToken } from '../token'

export type Rate = {
  chainId: ChainId
  isReverted: boolean
  rate: bigint
  revertedRate: bigint
  sourceToken: IToken
  destinationToken: IToken
}
