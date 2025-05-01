import {
  IApplicationContext,
  IProxyClient,
  IWallet,
  OrderStatusResult,
} from '@1inch-community/models'
import type { EIP712TypedData, SDK } from '@1inch/cross-chain-sdk'
import { Address, type Hash, isAddressEqual } from 'viem'

export class CrossChainSDK {
  private static instance: SDK

  constructor(private readonly appContext: IApplicationContext) {}

  async getInstance(): Promise<SDK> {
    if (!CrossChainSDK.instance) {
      CrossChainSDK.instance = await buildSDK(
        this.appContext.isEmbedded ? '/' : '/proxy/direct/',
        this.appContext.wallet,
        this.appContext.api.getProxyClient()
      )
    }

    return CrossChainSDK.instance
  }
}

async function buildSDK(host: string, walletController: IWallet, proxyClient: IProxyClient) {
  const { SDK } = await import('@1inch/cross-chain-sdk')
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

export class CrossChainSDKFacade {
  private context?: IApplicationContext
  private sdk?: SDK

  async init(context: IApplicationContext): Promise<void> {
    this.context = context
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
    this.sdk = await buildSDK(
      this.context.environment.get('oneInchDevPortalHost'),
      this.context.wallet,
      this.context.api.getProxyClient()
    )
    return this.sdk
  }
}
