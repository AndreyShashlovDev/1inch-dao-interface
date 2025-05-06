import {
  IBigFloat,
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

  async supportSwap(pair: Pair): Promise<boolean> {
    if (pair.source.chainId !== pair.destination.chainId) {
      return false
    }
    const rate = await this.rateProvider.getOnChainRate(
      pair.source.chainId,
      pair.source,
      pair.destination
    )

    return rate !== null && !rate.rate.isZero() && !rate.rate.isNegative()
  }

  async getDataSnapshot(
    pair: Pair,
    amount: IBigFloat,
    walletAddress: Address | null
  ): Promise<ISwapContextStrategyDataSnapshot> {
    const sourceToken = pair.source
    const sourceTokenAmount = amount
    const destinationToken = pair.destination
    const chainId = pair.source.chainId

    if (sourceTokenAmount.isZero()) {
      throw new Error('')
    }

    const rate = await this.rateProvider.getOnChainRate(chainId, sourceToken, destinationToken)

    if (rate === null) {
      throw new Error('')
    }

    let destinationTokenAmount: IBigFloat
    if (rate.isReverted) {
      destinationTokenAmount = sourceTokenAmount.div(rate.revertedRate)
    } else {
      destinationTokenAmount = sourceTokenAmount.mul(rate.rate)
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
