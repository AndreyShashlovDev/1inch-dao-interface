import { BigFloat } from '@1inch-community/core/math'
import {
  FusionPlusQuoteReceiveDto,
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
  HashLock,
  OrderStatus,
  OrderStatusResponse,
  QuoteParams,
  ReadyToAcceptSecretFills,
  SDK,
  SupportedChains,
} from '@1inch/cross-chain-sdk'
import { type Address, type Hash } from 'viem'
import { getWrapperNativeToken, isNativeToken } from '../../chain'
import { FusionPlusQuoteMapper, OneInchCrossChainSDK } from '../../one-inch-dev-portal/sdk'

interface Secret {
  hash: string
  secret: string
}

export class SwapContextFusionPlusStrategy
  implements ISwapContextStrategy<FusionPlusQuoteReceiveDto>
{
  private static supportChainIds = new Set<number>(SupportedChains.map((item) => item))

  constructor(
    private readonly crossChainSDK: OneInchCrossChainSDK,
    private readonly amountDataSource: IAmountDataSource,
    private readonly settings: SwapSettings
  ) {}

  async supportSwap(pair: Pair, address: Address | null): Promise<boolean> {
    return (
      address !== null &&
      pair.source.chainId !== pair.destination.chainId &&
      SwapContextFusionPlusStrategy.supportChainIds.has(pair.source.chainId) &&
      SwapContextFusionPlusStrategy.supportChainIds.has(pair.destination.chainId)
    )
  }

  async swap(swapSnapshot: SwapSnapshot<FusionPlusQuoteReceiveDto>): Promise<Hash> {
    const { walletAddress } = swapSnapshot
    const sdk = await this.crossChainSDK.getInstance()

    if (!walletAddress) {
      throw new Error('')
    }

    const quote = FusionPlusQuoteMapper.toDomain(swapSnapshot.rawResponseData)

    if (!quote.quoteId) {
      throw new Error('quoter has not returned quoteId')
    }

    const preset = quote.recommendedPreset
    const presetConfig = quote.presets[preset]!
    const secretsCount = presetConfig.secretsCount
    const [hashLock, secrets] = this.generateSecrets(secretsCount)
    const secretHashes = secrets.map((item) => item.hash)

    const { hash, quoteId, order } = await sdk.createOrder(quote, {
      walletAddress,
      hashLock,
      preset,
      // source, - we want to set some source aka NameOfService
      secretHashes,
    })

    await sdk.submitOrder(swapSnapshot.sourceToken.chainId.valueOf(), order, quoteId, secretHashes)
    await this.finalizeEscrowSecretsProcess(sdk, hash, secrets) // or wait in background?

    return hash as Hash
  }

  async getDataSnapshot(
    pair: Pair,
    amount: IBigFloat,
    walletAddress: Address | null
  ): Promise<ISwapContextStrategyDataSnapshot<FusionPlusQuoteReceiveDto>> {
    const sdk = await this.crossChainSDK.getInstance()
    let srcToken = pair.source
    const srcTokenAmount = amount
    const dstToken = pair.destination

    const srcChainId = srcToken?.chainId
    const dstChainId = dstToken?.chainId

    if (walletAddress === null || srcTokenAmount.isZero()) {
      throw new Error('')
    }

    const isSupportExchange = await this.supportSwap(
      {
        source: srcToken,
        destination: dstToken,
      },
      walletAddress
    )

    if (!isSupportExchange) {
      throw new Error(
        `Strategy ${SwapContextFusionPlusStrategy.name} not support exchange by presented pair/chain`
      )
    }

    const balance = await this.amountDataSource.getMaxAmount()

    if (srcTokenAmount.div(balance).isNegative()) {
      throw new Error('')
    }

    if (isNativeToken(srcToken.address)) {
      srcToken = getWrapperNativeToken(srcChainId)
    }

    const params: QuoteParams = {
      srcChainId: srcChainId.valueOf(),
      dstChainId: dstChainId.valueOf(),
      srcTokenAddress: srcToken.address,
      dstTokenAddress: dstToken.address,
      amount: srcTokenAmount.toBigInt(srcToken.decimals).toString(),
      enableEstimate: true,
      walletAddress: walletAddress.toString(),
    }

    const quote = await sdk.getQuote(params)
    const preset = quote.recommendedPreset
    const presetConfig = quote.getPreset(preset)

    const marketPrice = BigFloat.fromBigInt(quote.dstTokenAmount, dstToken.decimals)

    const rate = marketPrice.div(srcTokenAmount)
    const revertedRate = srcTokenAmount.div(marketPrice)

    const rateData: Rate = {
      rate,
      revertedRate,
      isReverted: false,
      sourceToken: srcToken,
      destinationToken: dstToken,
    }

    const slippageSettings = this.settings.slippage
    let minReceive = BigFloat.fromBigInt(presetConfig.auctionEndAmount, dstToken.decimals)
    if (slippageSettings.value !== null) {
      const [slippage] = slippageSettings.value
      const percentAmount = BigFloat.from(slippage).mul(marketPrice).div(BigFloat.from(100))
      minReceive = marketPrice.sub(percentAmount)
    }

    return {
      walletAddress,
      sourceToken: srcToken,
      destinationToken: dstToken,
      sourceTokenAmount: srcTokenAmount,
      minReceive,
      destinationTokenAmount: marketPrice,
      autoAuctionTime: Number(presetConfig.auctionDuration),
      autoSlippage: 1,
      rate: rateData,
      rawResponseData: FusionPlusQuoteMapper.toDto(params, quote),
    }
  }

  private async finalizeEscrowSecretsProcess(sdk: SDK, orderHash: string, secrets: Secret[]) {
    let secretsToShareResponse: ReadyToAcceptSecretFills | undefined
    let statusResponse: OrderStatusResponse | undefined

    while (true) {
      try {
        secretsToShareResponse = await sdk.getReadyToAcceptSecretFills(orderHash)
      } catch (e) {
        secretsToShareResponse = undefined
        console.warn(e)
      }

      try {
        statusResponse = await sdk.getOrderStatus(orderHash)
      } catch (e) {
        statusResponse = undefined
        console.warn(e)
      }

      const status = statusResponse?.status

      if (status === OrderStatus.Executed) {
        break
      }

      if (
        status === OrderStatus.Expired ||
        status === OrderStatus.Refunded ||
        status === OrderStatus.Cancelled
      ) {
        throw new Error(`Order break by ${status} reason`)
      }

      if (!secretsToShareResponse || secretsToShareResponse.fills.length === 0) {
        await new Promise((resolve) => setTimeout(() => resolve(undefined), 1000))
        continue
      }

      for (const { idx } of secretsToShareResponse.fills) {
        await sdk.submitSecret(orderHash, secrets[idx].secret)
      }
    }
  }

  private generateSecrets(secretsCount: number): [HashLock, Secret[]] {
    const secrets = this.generateRawSecrets(secretsCount)
    const hashLock =
      secrets.length === 1
        ? HashLock.forSingleFill(secrets[0])
        : HashLock.forMultipleFills(HashLock.getMerkleLeaves(secrets))

    return [
      hashLock,
      secrets.map<Secret>((secret) => ({
        secret,
        hash: HashLock.hashSecret(secret),
      })),
    ]
  }

  private generateRawSecrets(count: number): string[] {
    return Array.from({ length: count }, () => {
      const randomBuffer = new Uint8Array(32)
      crypto.getRandomValues(randomBuffer)

      return (
        '0x' +
        Array.from(randomBuffer)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
      )
    })
  }
}
