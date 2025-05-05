import { BigFloat } from '@1inch-community/core/math'
import {
  FusionQuoteReceiveDto,
  IOneInchDevPortalCrossChainAdapter,
  ISwapContext,
  ISwapContextStrategy,
  ISwapContextStrategyDataSnapshot,
  IWallet,
  Rate,
  SwapSettings,
  SwapSnapshot,
} from '@1inch-community/models'
import { Hash } from 'viem'
import { getWrapperNativeToken, isNativeToken } from '../chain'
import { PairHolder } from './pair-holder'
import { quoteMapper } from './quote-mapper'

// const RATE_BUMP_DENOMINATOR = 10_000_000n // 100%

export class SwapContextFusionStrategy
  implements ISwapContextStrategy<FusionQuoteReceiveDto | null>
{
  constructor(
    private readonly swapContext: ISwapContext,
    private readonly pairHolder: PairHolder,
    private readonly wallet: IWallet,
    private readonly settings: SwapSettings,
    private readonly devPortalAdapter: IOneInchDevPortalCrossChainAdapter
  ) {}

  async swap(swapSnapshot: SwapSnapshot<FusionQuoteReceiveDto | null>): Promise<Hash> {
    // const {
    //   sourceToken,
    //   destinationToken,
    //   sourceTokenAmount,
    //   destinationTokenAmount,
    //   slippage,
    //   auctionTime,
    //   rawResponseData,
    // } = swapSnapshot
    // const walletAddress = await this.wallet.data.getActiveAddress()
    // if (walletAddress === null) {
    //   throw new Error('Wallet not connected')
    // }
    // if (!rawResponseData) {
    //   throw new Error('')
    // }
    // // const fusionSDK = await buildFusionSdk(chainId, this.wallet)
    // // const permitData = await getPermit(chainId, sourceToken.address, walletAddress, getOneInchRouterV6ContractAddress(chainId))
    // const orderParams: OrderParams = {
    //   walletAddress,
    //   fromTokenAddress: sourceToken.address,
    //   toTokenAddress: destinationToken.address,
    //   amount: sourceTokenAmount.toString(),
    //   preset: rawResponseData.recommended_preset as any,
    // }
    // // if (permitData) {
    // //   // orderParams.permit = await preparePermit2ForSwap(chainId, walletAddress, permitData.signature, permitData.permitSingle)
    // //   // orderParams.isPermit2 = true
    // // }
    // const { type: slippageType, value: slippageValue } = slippage
    // const { type: auctionTimeType, value: auctionTimeValue } = auctionTime
    // if (slippageType !== 'auto' || auctionTimeType !== 'auto') {
    //   const preset = rawResponseData.presets[rawResponseData.recommended_preset]
    //   const auctionEndAmount =
    //     slippageType !== 'auto'
    //       ? destinationTokenAmount -
    //         BigMath.calculatePercentage(
    //           destinationTokenAmount,
    //           slippageValue ?? rawResponseData.autoK
    //         )
    //       : BigInt(preset.auctionEndAmount)
    //
    //   const auctionDuration =
    //     auctionTimeType !== 'auto'
    //       ? (auctionTimeValue ?? preset.auctionDuration)
    //       : preset.auctionDuration
    //   const auctionStartAmount = preset.auctionStartAmount
    //
    //   // const getToTokenAmount = (coefficient: number) => {
    //   //   let rate = coefficient - preset.gasCost.gasBumpEstimate
    //   //   if (rate < 0) rate = 0
    //   //   return (auctionEndAmount * (BigInt(rate) + RATE_BUMP_DENOMINATOR)) / RATE_BUMP_DENOMINATOR
    //   // }
    //   // const getDelay = (delay: number) => {
    //   //   if (auctionTimeType === 'auto') return delay
    //   //   return (delay * auctionTimeValue!) / preset.auctionDuration
    //   // }
    //   orderParams.customPreset = {
    //     auctionDuration,
    //     auctionStartAmount: BigInt(auctionStartAmount).toString(),
    //     auctionEndAmount: auctionEndAmount.toString(),
    //     // points: [
    //     //   ...preset.points.map((point, index) => ({
    //     //       delay: getDelay(point.delay),
    //     //       toTokenAmount: getToTokenAmount(point.coefficient).toString()
    //     //   }))
    //     // ]
    //   }
    //   orderParams.preset = PresetEnum.custom
    // }
    // // const createOrderResponse = await fusionSDK.createOrder(orderParams)
    // // const info = await fusionSDK.submitOrder(createOrderResponse.order, createOrderResponse.quoteId)
    // // return info.orderHash as Hash
    return '0x'
  }

  async getDataSnapshot(): Promise<ISwapContextStrategyDataSnapshot> {
    const sourceTokenSnapshot = this.pairHolder.getSnapshot('source')
    const destinationTokenSnapshot = this.pairHolder.getSnapshot('destination')
    let { token: sourceToken } = sourceTokenSnapshot
    const { amount: sourceTokenAmount } = sourceTokenSnapshot
    const { token: destinationToken } = destinationTokenSnapshot
    const chainId = sourceToken?.chainId ?? null
    const activeAddress = await this.wallet.data.getActiveAddress()

    if (
      chainId === null ||
      sourceToken === null ||
      destinationToken === null ||
      sourceTokenAmount === null ||
      activeAddress === null ||
      sourceTokenAmount.isZero()
    ) {
      throw new Error('')
    }

    const balance = await this.swapContext.getMaxAmount()

    if (balance < sourceTokenAmount) {
      throw new Error('')
    }

    if (isNativeToken(sourceToken.address)) {
      sourceToken = getWrapperNativeToken(chainId)
    }

    const fusionQuoteReceive = await this.devPortalAdapter.getQuote(
      sourceToken,
      destinationToken,
      sourceTokenAmount,
      activeAddress
    )

    if (fusionQuoteReceive === null) {
      throw new Error('')
    }
    const { toTokenAmount, recommendedPresetName, presets, autoSlippage } =
      quoteMapper(fusionQuoteReceive)
    const recommendedPreset = presets[recommendedPresetName]
    const marketPrice = BigFloat.fromBigInt(BigInt(toTokenAmount), destinationToken.decimals)

    const rate = marketPrice.div(sourceTokenAmount)
    const revertedRate = sourceTokenAmount.div(marketPrice)

    const rateData: Rate = {
      chainId,
      rate,
      revertedRate,
      isReverted: false,
      sourceToken: sourceToken,
      destinationToken: destinationToken,
    }

    const slippageSettings = this.settings.slippage
    let minReceive = BigFloat.fromBigInt(
      BigInt(recommendedPreset.auctionEndAmount),
      destinationToken.decimals
    )
    if (slippageSettings.value !== null) {
      const [slippage] = slippageSettings.value
      const percentAmount = BigFloat.from(slippage).mul(marketPrice).div(BigFloat.from(100))
      minReceive = marketPrice.sub(percentAmount)
    }

    return {
      chainId,
      sourceToken,
      destinationToken,
      sourceTokenAmount,
      minReceive,
      destinationTokenAmount: marketPrice,
      autoAuctionTime: recommendedPreset.auctionDuration,
      autoSlippage: autoSlippage,
      rate: rateData,
      rawResponseData: fusionQuoteReceive,
    }
  }
}
