import { Hash } from 'viem'
import { IBigFloat } from '../big-float'
import { ChainId } from '../chain'
import { IToken } from '../token'
import { Rate } from '../token-price'
import { SwapSnapshot } from './swap-snapshot'

export interface ISwapContextStrategy<SwapData> {
  getDataSnapshot(): Promise<ISwapContextStrategyDataSnapshot>
  swap(swapSnapshot: SwapSnapshot<SwapData>): Promise<Hash>
}

export interface ISwapContextStrategyDataSnapshot<T = unknown> {
  chainId: ChainId
  sourceToken: IToken
  destinationToken: IToken
  sourceTokenAmount: IBigFloat
  destinationTokenAmount: IBigFloat
  minReceive: IBigFloat
  autoSlippage: number | null
  autoAuctionTime: number | null
  rate: Rate
  rawResponseData: T
}
