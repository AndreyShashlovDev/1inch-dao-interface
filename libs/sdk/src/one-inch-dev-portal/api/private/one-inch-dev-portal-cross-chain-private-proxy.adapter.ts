import { CacheActivePromise } from '@1inch-community/core/decorators'
import { lazyAppContext } from '@1inch-community/core/lazy'
import {
  ChainId,
  GasPriceDto,
  IApplicationContext,
  ICryptoAssetDataProvider,
  IProxyClient,
  ITokenV2Dto,
  ProxyResultBalance,
  ProxyResultTokenPrice,
} from '@1inch-community/models'
import { Address } from 'viem'
import { OneInchDevPortalCrossChainOnChainAdapter } from '../onchain'
import { PrivateProxyClient } from './private-proxy-client'

export class OneInchDevPortalCrossChainPrivateProxyAdapter implements ICryptoAssetDataProvider {
  private readonly context = lazyAppContext('OneInchDevPortalCrossChainPublicProxyAdapter')
  private readonly client = new PrivateProxyClient()
  private readonly fallBackAdapter = new OneInchDevPortalCrossChainOnChainAdapter()

  async init(context: IApplicationContext): Promise<void> {
    this.context.set(context)
    await Promise.all([this.client.init(context), this.fallBackAdapter.init(context)])
  }

  @CacheActivePromise()
  async getBalances(chainIds: ChainId[], walletAddresses: Address[]): Promise<ProxyResultBalance> {
    return await this.client.post<ProxyResultBalance>('/proxy/balance', {
      chain_ids: chainIds.map((chainId) => chainId.toString()),
      addresses: walletAddresses,
    })
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
