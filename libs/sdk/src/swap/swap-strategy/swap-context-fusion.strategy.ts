import { BigFloat } from '@1inch-community/core/math'
import {
  FusionQuoteReceiveDto,
  IAmountDataSource,
  IBigFloat,
  ISwapContextStrategy,
  ISwapContextStrategyDataSnapshot,
  Pair,
  Rate,
  SwapSettings,
  SwapSnapshot,
} from '@1inch-community/models'
import {
  Address as FusionAddress,
  FusionSDK,
  NetworkEnum,
  OrderParams,
  OrderStatus,
  OrderStatusResponse,
} from '@1inch/fusion-sdk'
import { type Address, type Hash } from 'viem'
import { getWrapperNativeToken, isNativeToken } from '../../chain'
import { FusionQuoteMapper, OneInchSingleChainSDK } from '../../one-inch-dev-portal/sdk'

export class SwapContextFusionStrategy
  implements ISwapContextStrategy<FusionQuoteReceiveDto | null>
{
  constructor(
    private readonly chainSdk: OneInchSingleChainSDK,
    private readonly amountDataSource: IAmountDataSource,
    private readonly settings: SwapSettings
  ) {}

  async supportSwap(pair: Pair, address: Address | null): Promise<boolean> {
    return (
      address !== null &&
      pair.destination.chainId === pair.source.chainId &&
      NetworkEnum[pair.source.chainId] !== undefined
    )
  }

  async swap(swapSnapshot: SwapSnapshot<FusionQuoteReceiveDto>): Promise<Hash> {
    const { sourceToken, destinationToken, sourceTokenAmount, rawResponseData, walletAddress } =
      swapSnapshot

    if (walletAddress === null) {
      throw new Error('Wallet not connected')
    }

    if (!rawResponseData) {
      throw new Error('')
    }

    const sdk = await this.chainSdk.getInstance(swapSnapshot.sourceToken.chainId)
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
      receiver: orderParams.receiver ? new FusionAddress(orderParams.receiver) : undefined,
      preset: orderParams.preset,
      nonce: orderParams.nonce,
      allowPartialFills: orderParams.allowPartialFills,
      allowMultipleFills: orderParams.allowMultipleFills,
      orderExpirationDelay: orderParams.orderExpirationDelay,
      network: swapSnapshot.sourceToken.chainId.valueOf(),
    })

    const info = await sdk.submitOrder(order, quote.quoteId)
    await this.checkOrderStatus(sdk, info.orderHash)

    return info.orderHash as Hash
  }

  async getDataSnapshot(
    pair: Pair,
    sourceTokenAmount: IBigFloat,
    walletAddress: Address | null
  ): Promise<ISwapContextStrategyDataSnapshot<FusionQuoteReceiveDto>> {
    let sourceToken = pair.source
    const destinationToken = pair.destination
    const chainId = sourceToken.chainId

    if (sourceTokenAmount.isZero() || !walletAddress) {
      throw new Error('')
    }

    const isSupportExchange = await this.supportSwap(
      {
        source: sourceToken,
        destination: destinationToken,
      },
      walletAddress
    )

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
      walletAddress: walletAddress.toString(),
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

    const marketPrice = BigFloat.fromBigInt(BigInt(quote.toTokenAmount), destinationToken.decimals)

    const rate = marketPrice.div(sourceTokenAmount)
    const revertedRate = sourceTokenAmount.div(marketPrice)

    const rateData: Rate = {
      rate,
      revertedRate,
      isReverted: false,
      sourceToken: sourceToken,
      destinationToken: destinationToken,
    }

    const slippageSettings = this.settings.slippage
    let minReceive = BigFloat.fromBigInt(preset.auctionEndAmount, destinationToken.decimals)

    if (slippageSettings.value !== null) {
      const [slippage] = slippageSettings.value
      const percentAmount = BigFloat.from(slippage).mul(marketPrice).div(BigFloat.from(100))
      minReceive = marketPrice.sub(percentAmount)
    }

    return {
      walletAddress,
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
