import { BigMath } from '@1inch-community/core/math'
import {
  FusionPlusQuoteReceiveDto,
  ISwapContext,
  ISwapContextStrategy,
  ISwapContextStrategyDataSnapshot,
  IWallet,
  Pair,
  Rate,
  SwapSettings,
  SwapSnapshot,
} from '@1inch-community/models'
import { HashLock, OrderStatus, QuoteParams, SDK, SupportedChains } from '@1inch/cross-chain-sdk'
import { Hash } from 'viem'
import { getWrapperNativeToken, isNativeToken } from '../chain'
import { CrossChainSDK } from '../one-inch-dev-portal/sdk'
import { PairHolder } from './pair-holder'

interface Secret {
  hash: string
  secret: string
}

export class SwapContextFusionPlusStrategy
  implements ISwapContextStrategy<FusionPlusQuoteReceiveDto | null>
{
  private static supportChainIds = new Set<number>(SupportedChains.map((item) => item))

  constructor(
    private readonly crossChainSDK: CrossChainSDK,
    private readonly wallet: IWallet,
    private readonly pairHolder: PairHolder,
    private readonly swapContext: ISwapContext,
    private readonly settings: SwapSettings
  ) {}

  async supportSwap(pair: Pair): Promise<boolean> {
    return (
      SwapContextFusionPlusStrategy.supportChainIds.has(pair.source.chainId) &&
      SwapContextFusionPlusStrategy.supportChainIds.has(pair.destination.chainId)
    )
  }

  async swap(swapSnapshot: SwapSnapshot<FusionPlusQuoteReceiveDto | null>): Promise<Hash> {
    const walletAddress = await this.wallet.data.getActiveAddress()
    const sdk = await this.crossChainSDK.getInstance()

    if (!walletAddress) {
      throw new Error('')
    }

    const params: QuoteParams = {
      srcChainId: swapSnapshot.sourceToken.chainId.valueOf(),
      dstChainId: swapSnapshot.destinationToken.chainId.valueOf(),
      srcTokenAddress: swapSnapshot.sourceToken.address,
      dstTokenAddress: swapSnapshot.destinationToken.address,
      amount: swapSnapshot.sourceTokenAmount.toString(),
      enableEstimate: true,
      walletAddress,
    }

    const quote = await sdk.getQuote(params)
    const preset = quote.recommendedPreset
    const presetConfig = quote.getPreset(preset)
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

    await sdk.submitOrder(quote.srcChainId, order, quoteId, secretHashes)
    await this.finalizeEscrowSecretsProcess(sdk, hash, secrets) // or wait in background

    return hash as Hash
  }

  async getDataSnapshot(): Promise<ISwapContextStrategyDataSnapshot> {
    const sdk = await this.crossChainSDK.getInstance()
    const srcTokenSnapshot = this.pairHolder.getSnapshot('source')
    const destTokenSnapshot = this.pairHolder.getSnapshot('destination')
    let { token: srcToken } = srcTokenSnapshot
    const { amount: srcTokenAmount } = srcTokenSnapshot
    const { token: destToken } = destTokenSnapshot
    const srcChainId = srcToken?.chainId
    const destChainId = destToken?.chainId
    const walletAddress = await this.wallet.data.getActiveAddress()

    if (
      !srcChainId ||
      !destChainId ||
      srcToken === null ||
      destToken === null ||
      srcTokenAmount === null ||
      walletAddress === null ||
      srcTokenAmount === 0n ||
      srcTokenSnapshot === null ||
      srcTokenSnapshot.token === null
    ) {
      throw new Error('')
    }

    const balance = await this.swapContext.getMaxAmount()

    if (balance < srcTokenAmount) {
      throw new Error('')
    }

    if (isNativeToken(srcToken.address)) {
      srcToken = getWrapperNativeToken(srcChainId)
    }

    const params: QuoteParams = {
      srcChainId: srcChainId.valueOf(),
      dstChainId: destChainId.valueOf(),
      srcTokenAddress: srcToken.address,
      dstTokenAddress: destToken.address,
      amount: srcTokenAmount.toString(),
      enableEstimate: true,
      walletAddress,
    }

    const quote = await sdk.getQuote(params)
    const preset = quote.recommendedPreset
    const presetConfig = quote.getPreset(preset)

    const marketPrice = quote.dstTokenAmount

    const rate = BigMath.div(marketPrice, srcTokenAmount, destToken.decimals, srcToken.decimals)
    const revertedRate = BigMath.div(
      srcTokenAmount,
      marketPrice,
      srcToken.decimals,
      destToken.decimals
    )

    const rateData: Rate = {
      sourceChainId: srcChainId,
      destinationChainId: destChainId,
      rate,
      revertedRate,
      isReverted: false,
      sourceToken: srcToken,
      destinationToken: destToken,
    }

    const slippageSettings = this.settings.slippage
    let minReceive = BigInt(presetConfig.auctionEndAmount)
    if (slippageSettings.value !== null) {
      const [slippage] = slippageSettings.value
      const percentAmount = BigMath.calculatePercentage(marketPrice, slippage)
      minReceive = marketPrice - percentAmount
    }

    return {
      sourceChainId: srcChainId,
      sourceToken: srcToken,
      destinationChainId: destChainId,
      destinationToken: destToken,
      sourceTokenAmount: srcTokenAmount,
      minReceive,
      destinationTokenAmount: marketPrice,
      autoAuctionTime: Number(presetConfig.auctionDuration),
      autoSlippage: 1,
      rate: rateData,
      rawResponseData: quote,
    }
  }

  private async finalizeEscrowSecretsProcess(sdk: SDK, orderHash: string, secrets: Secret[]) {
    while (true) {
      const secretsToShare = await sdk.getReadyToAcceptSecretFills(orderHash)

      if (secretsToShare.fills.length) {
        for (const { idx } of secretsToShare.fills) {
          await sdk.submitSecret(orderHash, secrets[idx].secret)

          console.log({ idx }, 'shared secret')
        }
      }

      const { status } = await sdk.getOrderStatus(orderHash)

      if (status === OrderStatus.Executed) {
        break
      }

      if (status === OrderStatus.Expired || status === OrderStatus.Refunded) {
        throw new Error('')
      }

      await new Promise((resolve) => setTimeout(() => resolve(undefined), 1000))
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
