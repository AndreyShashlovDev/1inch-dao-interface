import { Hash, type Address } from 'viem'
import { IBigFloat } from '../big-float'
import { IToken } from '../token'
import { Rate } from '../token-price'
import { Pair } from './swap-context'
import { SwapSnapshot } from './swap-snapshot'

export interface ISwapContextStrategy<SwapData> {
  supportSwap(pair: Pair, walletAddress: Address | null): Promise<boolean>
  getDataSnapshot(
    pair: Pair,
    amount: IBigFloat,
    walletAddress: Address | null
  ): Promise<ISwapContextStrategyDataSnapshot>
  swap(swapSnapshot: SwapSnapshot<SwapData>): Promise<Hash>
}

export interface ISwapContextStrategyDataSnapshot<T = unknown> {
  walletAddress: Address | null
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
