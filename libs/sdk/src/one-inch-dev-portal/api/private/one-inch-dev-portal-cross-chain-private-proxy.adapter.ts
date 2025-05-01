import { CacheActivePromise } from '@1inch-community/core/decorators'
import { lazyAppContext } from '@1inch-community/core/lazy'
import {
  ChainId,
  GasPriceDto,
  IApplicationContext,
  IOneInchDevPortalCrossChainAdapter,
  IProxyClient,
  ITokenV2Dto,
  OrderStatusResult,
  ProxyResultBalance,
  ProxyResultTokenPrice,
} from '@1inch-community/models'
import { Address, type Hash } from 'viem'
import { CrossChainSDKFacade } from '../../sdk'
import { OneInchDevPortalCrossChainOnChainAdapter } from '../onchain'
import { PrivateProxyClient } from './private-proxy-client'

export class OneInchDevPortalCrossChainPrivateProxyAdapter
  implements IOneInchDevPortalCrossChainAdapter
{
  private readonly context = lazyAppContext('OneInchDevPortalCrossChainPublicProxyAdapter')
  private readonly client = new PrivateProxyClient()
  private readonly sdkFacade = new CrossChainSDKFacade()
  private readonly fallBackAdapter = new OneInchDevPortalCrossChainOnChainAdapter()

  async init(context: IApplicationContext): Promise<void> {
    this.context.set(context)
    await Promise.all([
      this.client.init(context),
      this.sdkFacade.init(context),
      this.fallBackAdapter.init(context),
    ])
  }

  @CacheActivePromise()
  async getBalances(chainIds: ChainId[], walletAddresses: Address[]): Promise<ProxyResultBalance> {
    try {
      return await this.client.post<ProxyResultBalance>('/proxy/balance', {
        chain_ids: chainIds.map((chainId) => chainId.toString()),
        addresses: walletAddresses,
      })
    } catch {
      return await this.fallBackAdapter.getBalances(chainIds, walletAddresses)
    }
  }

  async getTokenBalances(
    chainId: ChainId,
    walletAddress: Address,
    tokenAddress: Address
  ): Promise<bigint> {
    return await this.fallBackAdapter.getTokenBalances(chainId, walletAddress, tokenAddress)
  }

  @CacheActivePromise()
  async getTokenList(): Promise<ITokenV2Dto[]> {
    const walletIsConnected = await this.walletIsConnected()
    if (!walletIsConnected) {
      return await this.fallBackAdapter.getTokenList()
    }
    try {
      return this.client.get('/proxy/token-list')
    } catch {
      return await this.fallBackAdapter.getTokenList()
    }
  }

  @CacheActivePromise()
  async getTokenPrice(): Promise<ProxyResultTokenPrice> {
    return this.client.get('/proxy/token-price')
  }

  @CacheActivePromise()
  getOrderStatus(orderHash: Hash): Promise<OrderStatusResult | null> {
    return this.sdkFacade.getOrderStatus(orderHash)
  }

  @CacheActivePromise()
  cancelOrder(orderHash: Hash): Promise<Hash | null> {
    return this.sdkFacade.cancelOrder(orderHash)
  }

  getGasPrice(): Promise<GasPriceDto | null> {
    throw new Error('Method not implemented.')
  }

  getProxyClient(): IProxyClient {
    return this.client
  }

  private walletIsConnected() {
    return this.context.value.wallet.data.isConnected()
  }
}
