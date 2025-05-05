import type { IBigFloat } from '../big-float'
import type { IToken } from '../token'

export type Rate = {
  isReverted: boolean
  rate: IBigFloat
  revertedRate: IBigFloat
  sourceToken: IToken
  destinationToken: IToken
}
