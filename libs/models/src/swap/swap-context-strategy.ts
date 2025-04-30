import { Hash } from 'viem'
import { ChainId } from '../chain'
import { IToken } from '../token'
import { Rate } from '../token-price'
import { Pair } from './swap-context'
import { SwapSnapshot } from './swap-snapshot'

export interface ISwapContextStrategy<SwapData> {
  supportSwap(pair: Pair): Promise<boolean>
  getDataSnapshot(): Promise<ISwapContextStrategyDataSnapshot>
  swap(swapSnapshot: SwapSnapshot<SwapData>): Promise<Hash>
}

export interface ISwapContextStrategyDataSnapshot<T = unknown> {
  sourceChainId: ChainId
  sourceToken: IToken
  destinationChainId: ChainId
  destinationToken: IToken
  sourceTokenAmount: bigint
  destinationTokenAmount: bigint
  minReceive: bigint
  autoSlippage: number | null
  autoAuctionTime: number | null
  rate: Rate
  rawResponseData: T
}
