import { BigMath } from '@1inch-community/core/math'
import {
  ISwapContextStrategy,
  ISwapContextStrategyDataSnapshot,
  ITokenRateProvider,
  IWallet,
} from '@1inch-community/models'
import { Hash } from 'viem'
import { PairHolder } from './pair-holder'

export class SwapContextOnChainStrategy implements ISwapContextStrategy<unknown> {
  constructor(
    private readonly pairHolder: PairHolder,
    private readonly wallet: IWallet,
    private readonly rateProvider: ITokenRateProvider
  ) {}

  swap(): Promise<Hash> {
    throw new Error('OnChain strategy not support swap')
  }

  async getDataSnapshot(): Promise<ISwapContextStrategyDataSnapshot> {
    const sourceTokenSnapshot = this.pairHolder.getSnapshot('source')
    const destinationTokenSnapshot = this.pairHolder.getSnapshot('destination')
    const { token: sourceToken, amount: sourceTokenAmount } = sourceTokenSnapshot
    const { token: destinationToken } = destinationTokenSnapshot
    const chainId = await this.wallet.data.getChainId()

    if (
      chainId === null ||
      sourceToken === null ||
      destinationToken === null ||
      sourceTokenAmount === null
    ) {
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
      chainId,
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
