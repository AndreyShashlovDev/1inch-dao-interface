import { BigMath } from '@1inch-community/core/math'
import {
  FusionQuoteReceiveDto,
  IAmountDataSource,
  ISwapContextStrategy,
  ISwapContextStrategyDataSnapshot,
  IWallet,
  Pair,
  Rate,
  SwapSettings,
  SwapSnapshot,
} from '@1inch-community/models'
import {
  Address,
  FusionSDK,
  NetworkEnum,
  OrderParams,
  OrderStatus,
  OrderStatusResponse,
} from '@1inch/fusion-sdk'
import { Hash } from 'viem'
import { getWrapperNativeToken, isNativeToken } from '../chain'
import { OneInchSingleChainSDK } from '../one-inch-dev-portal/sdk/1inch-single-chain-sdk'
import { FusionQuoteMapper } from '../one-inch-dev-portal/sdk/mapper/fusion-quote.mapper'
import { PairHolder } from './pair-holder'

// const RATE_BUMP_DENOMINATOR = 10_000_000n // 100%

export class SwapContextFusionStrategy
  implements ISwapContextStrategy<FusionQuoteReceiveDto | null>
{
  constructor(
    private readonly chainSdk: OneInchSingleChainSDK,
    private readonly amountDataSource: IAmountDataSource,
    private readonly pairHolder: PairHolder,
    private readonly wallet: IWallet,
    private readonly settings: SwapSettings
  ) {}

  async supportSwap(pair: Pair): Promise<boolean> {
    return (
      pair.destination.chainId === pair.source.chainId &&
      NetworkEnum[pair.source.chainId] !== undefined
    )
  }

  async swap(swapSnapshot: SwapSnapshot<FusionQuoteReceiveDto>): Promise<Hash> {
    const { sourceChainId, sourceToken, destinationToken, sourceTokenAmount, rawResponseData } =
      swapSnapshot

    const walletAddress = await this.wallet.data.getActiveAddress()

    if (walletAddress === null) {
      throw new Error('Wallet not connected')
    }

    if (!rawResponseData) {
      throw new Error('')
    }

    const sdk = await this.chainSdk.getInstance(swapSnapshot.sourceChainId)
    // const permitData = await getPermit(chainId, sourceToken.address, walletAddress, getOneInchRouterV6ContractAddress(chainId))

    // if (permitData) {
    //   // orderParams.permit = await preparePermit2ForSwap(chainId, walletAddress, permitData.signature, permitData.permitSingle)
    //   // orderParams.isPermit2 = true
    // }

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

    // const getToTokenAmount = (coefficient: number) => {
    //   let rate = coefficient - preset.gasCost.gasBumpEstimate
    //   if (rate < 0) rate = 0
    //   return (auctionEndAmount * (BigInt(rate) + RATE_BUMP_DENOMINATOR)) / RATE_BUMP_DENOMINATOR
    // }
    // const getDelay = (delay: number) => {
    //   if (auctionTimeType === 'auto') return delay
    //   return (delay * auctionTimeValue!) / preset.auctionDuration
    // }
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

    const quote = FusionQuoteMapper.toDomain(rawResponseData)

    if (!quote.quoteId) {
      throw new Error('quoter has not returned quoteId')
    }

    const orderParams: OrderParams = {
      walletAddress,
      fromTokenAddress: sourceToken.address,
      toTokenAddress: destinationToken.address,
      amount: sourceTokenAmount.toString(),
      preset: rawResponseData.response.recommended_preset,
    }

    const order = await quote.createFusionOrder({
      receiver: orderParams.receiver ? new Address(orderParams.receiver) : undefined,
      preset: orderParams.preset,
      nonce: orderParams.nonce,
      allowPartialFills: orderParams.allowPartialFills,
      allowMultipleFills: orderParams.allowMultipleFills,
      orderExpirationDelay: orderParams.orderExpirationDelay,
      network: sourceChainId.valueOf(),
    })

    const info = await sdk.submitOrder(order, quote.quoteId)
    await this.checkOrderStatus(sdk, info.orderHash)

    return info.orderHash as Hash
  }

  async getDataSnapshot(): Promise<ISwapContextStrategyDataSnapshot<FusionQuoteReceiveDto>> {
    const sourceTokenSnapshot = this.pairHolder.getSnapshot('source')
    const destinationTokenSnapshot = this.pairHolder.getSnapshot('destination')
    let { token: sourceToken } = sourceTokenSnapshot
    const { amount: sourceTokenAmount } = sourceTokenSnapshot
    const { token: destinationToken } = destinationTokenSnapshot
    const chainId = await this.wallet.data.getChainId()
    const activeAddress = await this.wallet.data.getActiveAddress()

    if (
      chainId === null ||
      sourceToken === null ||
      destinationToken === null ||
      sourceTokenAmount === null ||
      activeAddress === null ||
      sourceTokenAmount === 0n
    ) {
      throw new Error('')
    }

    const isSupportExchange = await this.supportSwap({
      source: sourceToken,
      destination: destinationToken,
    })

    if (!isSupportExchange) {
      throw new Error(
        `Strategy ${SwapContextFusionStrategy.name} not support exchange by presented pair/chain`
      )
    }

    const sdk = await this.chainSdk.getInstance(chainId)
    const balance = await this.amountDataSource.getMaxAmount()

    if (balance < sourceTokenAmount) {
      throw new Error('')
    }

    if (isNativeToken(sourceToken.address)) {
      sourceToken = getWrapperNativeToken(chainId)
    }

    const orderParams: OrderParams = {
      walletAddress: activeAddress,
      fromTokenAddress: sourceToken.address,
      toTokenAddress: destinationToken.address,
      amount: sourceTokenAmount.toString(),
    }

    const quote = await sdk.getQuote(orderParams)

    if (quote === null) {
      throw new Error('')
    }
    const recommendedPreset = quote.recommendedPreset
    const preset = quote.getPreset(recommendedPreset)
    const autoSlippage = 1
    const marketPrice = BigInt(quote.toTokenAmount)

    const rate = BigMath.div(
      marketPrice,
      sourceTokenAmount,
      destinationToken.decimals,
      sourceToken.decimals
    )
    const revertedRate = BigMath.div(
      sourceTokenAmount,
      marketPrice,
      sourceToken.decimals,
      destinationToken.decimals
    )

    const rateData: Rate = {
      sourceChainId: chainId,
      destinationChainId: chainId,
      rate,
      revertedRate,
      isReverted: false,
      sourceToken: sourceToken,
      destinationToken: destinationToken,
    }

    const slippageSettings = this.settings.slippage
    let minReceive = BigInt(preset.auctionEndAmount)

    if (slippageSettings.value !== null) {
      const [slippage] = slippageSettings.value
      const percentAmount = BigMath.calculatePercentage(marketPrice, slippage)
      minReceive = marketPrice - percentAmount
    }

    return {
      sourceChainId: chainId,
      destinationChainId: chainId,
      sourceToken,
      destinationToken,
      sourceTokenAmount,
      minReceive,
      destinationTokenAmount: marketPrice,
      autoAuctionTime: Number(preset.auctionDuration),
      autoSlippage: autoSlippage,
      rate: rateData,
      rawResponseData: FusionQuoteMapper.toDto(orderParams, quote),
    }
  }

  private async checkOrderStatus(sdk: FusionSDK, orderHash: string): Promise<void> {
    let statusResponse: OrderStatusResponse | undefined

    while (true) {
      try {
        statusResponse = await sdk.getOrderStatus(orderHash)
      } catch (e) {
        statusResponse = undefined
        console.warn(e)
      }

      if (
        !statusResponse ||
        statusResponse.status === OrderStatus.Pending ||
        statusResponse.status === OrderStatus.PartiallyFilled
      ) {
        await new Promise((resolve) => setTimeout(() => resolve(undefined), 1000))
      } else if (statusResponse.status === OrderStatus.Filled) {
        break
      } else {
        throw new Error(`Order break by ${statusResponse.status} reason`)
      }
    }
  }
}
