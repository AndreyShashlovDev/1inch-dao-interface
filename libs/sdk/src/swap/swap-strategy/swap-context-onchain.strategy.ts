import { BigMath } from '@1inch-community/core/math'
import {
  ISwapContextStrategy,
  ISwapContextStrategyDataSnapshot,
  ITokenRateProvider,
  Pair,
} from '@1inch-community/models'
import { type Address, type Hash } from 'viem'

export class SwapContextOnChainStrategy implements ISwapContextStrategy<unknown> {
  constructor(private readonly rateProvider: ITokenRateProvider) {}

  swap(): Promise<Hash> {
    throw new Error('OnChain strategy not support swap')
  }

  async supportSwap(pair: Pair, address: Address | null): Promise<boolean> {
    if (pair.source.chainId !== pair.destination.chainId) {
      return false
    }
    const rate = await this.rateProvider.getOnChainRate(
      pair.source.chainId,
      pair.source,
      pair.destination
    )

    return rate !== null && rate.rate > 0n
  }

  async getDataSnapshot(
    pair: Pair,
    amount: bigint,
    walletAddress: Address | null
  ): Promise<ISwapContextStrategyDataSnapshot> {
    const sourceToken = pair.source
    const sourceTokenAmount = amount
    const destinationToken = pair.destination
    const chainId = pair.source.chainId

    if (sourceTokenAmount === 0n) {
      throw new Error('')
    }

    const rate = await this.rateProvider.getOnChainRate(chainId, sourceToken, destinationToken)

    if (rate === null) {
      throw new Error('')
    }

    let destinationTokenAmount: bigint
    if (rate.isReverted) {
      destinationTokenAmount = BigMath.div(
        sourceTokenAmount,
        rate.revertedRate,
        sourceToken.decimals,
        sourceToken.decimals,
        destinationToken.decimals
      )
    } else {
      destinationTokenAmount = BigMath.mul(
        sourceTokenAmount,
        rate.rate,
        sourceToken.decimals,
        destinationToken.decimals,
        destinationToken.decimals
      )
    }

    return {
      walletAddress,
      sourceToken,
      destinationToken,
      sourceTokenAmount,
      destinationTokenAmount,
      rate,
      minReceive: destinationTokenAmount,
      autoAuctionTime: null,
      autoSlippage: null,
      rawResponseData: null,
    }
  }
}
