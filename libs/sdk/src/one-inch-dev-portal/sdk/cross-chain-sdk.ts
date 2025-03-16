import { getEnvironmentValue } from '@1inch-community/core/environment'
import {
  IApplicationContext,
  ICrossChainSDKFacade,
  IProxyClient,
  IToken,
  IWallet,
  OrderStatusResult,
  QuoteReceiveCustomPreset,
  QuoteResult,
} from '@1inch-community/models'
import type { EIP712TypedData, Quote, SDK } from '@1inch/cross-chain-sdk'
import { Address, type Hash, isAddressEqual } from 'viem'

async function buildSDK(walletController: IWallet, proxyClient: IProxyClient) {
  const { SDK } = await import('@1inch/cross-chain-sdk')
  const host: string = getEnvironmentValue('oneInchDevPortalHost')
  return new SDK({
    url: host,
    httpProvider: proxyClient,
    blockchainProvider: {
      signTypedData: async (
        walletAddress: Address,
        typedData: EIP712TypedData
      ): Promise<string> => {
        const activeWalletAddress = await walletController.data.getActiveAddress()
        if (!activeWalletAddress || !isAddressEqual(activeWalletAddress, walletAddress)) {
          throw new Error('')
        }
        return await walletController.signTypedData(typedData as any)
      },
      ethCall: async (): Promise<string> => {
        return ''
      },
    },
  })
}

export class CrossChainSDKFacade implements ICrossChainSDKFacade {
  private context?: IApplicationContext
  private sdk?: SDK

  async init(context: IApplicationContext): Promise<void> {
    this.context = context
  }

  async getQuote(
    fromToken: IToken,
    toToken: IToken,
    amount: bigint,
    walletAddress: Address,
    customPreset?: QuoteReceiveCustomPreset,
    enableEstimate?: boolean
  ): Promise<QuoteResult | null> {
    const sdk = await this.buildSDK()
    if (!sdk) return null
    const params = {
      srcChainId: fromToken.chainId as any,
      dstChainId: toToken.chainId as any,
      srcTokenAddress: fromToken.address,
      dstTokenAddress: toToken.address,
      amount: amount.toString(),
      walletAddress: walletAddress,
      enableEstimate: enableEstimate,
    }
    let quote: Quote
    if (customPreset) {
      quote = await sdk.getQuoteWithCustomPreset(params, { customPreset })
    } else {
      quote = await sdk.getQuote(params)
    }
    return {
      toTokenAmount: quote.dstTokenAmount,
      recommendedPresetName: quote.recommendedPreset,
      presets: quote.presets as any,
      autoSlippage: 1,
    } satisfies QuoteResult
  }

  async getOrderStatus(orderHash: Hash): Promise<OrderStatusResult | null> {
    const sdk = await this.buildSDK()
    if (!sdk) return null
    const status = await sdk.getOrderStatus(orderHash)
    return {
      status: status.status,
      makerTraits: status.order.makerTraits,
      fromTokenAddress: status.order.makerAsset as Address,
      toTokenAddress: status.order.takerAsset as Address,
      takingAmount: BigInt(status.order.takingAmount),
      makingAmount: BigInt(status.order.makingAmount),
      auctionDuration: status.auctionDuration,
      auctionStartDate: status.auctionStartDate,
    } satisfies OrderStatusResult
  }

  async cancelOrder(orderHash: Hash): Promise<Hash | null> {
    if (!this.context) return null
    const sdk = await this.buildSDK()
    if (!sdk) return null
    const callData = await sdk.buildCancelOrderCallData(orderHash)
    return callData as Hash
  }

  private async buildSDK() {
    if (this.sdk) return this.sdk
    if (!this.context) return null
    this.sdk = await buildSDK(this.context.wallet, this.context.api.getProxyClient())
    return this.sdk
  }
}
