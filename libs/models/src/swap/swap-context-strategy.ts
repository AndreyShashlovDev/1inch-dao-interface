import { type Address, type Hash } from 'viem'
import { IToken } from '../token'
import { Rate } from '../token-price'
import { Pair } from './swap-context'
import { SwapSnapshot } from './swap-snapshot'

export interface ISwapContextStrategy<SwapData> {
  supportSwap(pair: Pair, walletAddress: Address | null): Promise<boolean>
  getDataSnapshot(
    pair: Pair,
    amount: bigint,
    walletAddress: Address | null
  ): Promise<ISwapContextStrategyDataSnapshot>
  swap(swapSnapshot: SwapSnapshot<SwapData>): Promise<Hash>
}

export interface ISwapContextStrategyDataSnapshot<T = unknown> {
  walletAddress: Address | null
  sourceToken: IToken
  destinationToken: IToken
  sourceTokenAmount: bigint
  destinationTokenAmount: bigint
  minReceive: bigint
  autoSlippage: number | null
  autoAuctionTime: number | null
  rate: Rate
  rawResponseData: T
}
