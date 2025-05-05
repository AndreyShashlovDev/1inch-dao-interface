import { CacheActivePromise } from '@1inch-community/core/decorators'
import { lazyAppContext } from '@1inch-community/core/lazy'
import {
  ChainId,
  FusionPlusQuoteReceiveDto,
  FusionQuoteReceiveDto,
  GasPriceDto,
  IApplicationContext,
  IBigFloat,
  IOneInchDevPortalCrossChainAdapter,
  IProxyClient,
  IToken,
  ITokenV2Dto,
  OrderStatusResult,
  ProxyResultBalance,
  ProxyResultTokenPrice,
  QuoteReceiveCustomPreset,
} from '@1inch-community/models'
import { Address, type Hash } from 'viem'
import { OneInchDevPortalCrossChainOnChainAdapter } from '../onchain'
import { PrivateProxyClient } from './private-proxy-client'

export class OneInchDevPortalCrossChainPrivateProxyAdapter
  implements IOneInchDevPortalCrossChainAdapter
{
  private readonly context = lazyAppContext('OneInchDevPortalCrossChainPublicProxyAdapter')
  private readonly client = new PrivateProxyClient()
  private readonly fallBackAdapter = new OneInchDevPortalCrossChainOnChainAdapter()

  async init(context: IApplicationContext): Promise<void> {
    this.context.set(context)
    await Promise.all([this.client.init(context), this.fallBackAdapter.init(context)])
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
  getQuote(
    fromToken: IToken,
    toToken: IToken,
    amount: IBigFloat,
    walletAddress: Address,
    customPreset?: QuoteReceiveCustomPreset,
    enableEstimate?: boolean
  ): Promise<FusionQuoteReceiveDto | FusionPlusQuoteReceiveDto | null> {
    if (fromToken.chainId !== toToken.chainId) {
      const params = new URLSearchParams({
        srcChain: fromToken.chainId.toString(),
        dstChain: toToken.chainId.toString(),
        srcTokenAddress: fromToken.address,
        dstTokenAddress: toToken.address,
        amount: amount.toBigInt(fromToken.decimals).toString(10),
        walletAddress: walletAddress,
        enableEstimate: `${enableEstimate ?? false}`,
      })
      const url = `/proxy/direct/fusion-plus/quoter/v1.0/quote/receive?${params.toString()}`
      if (customPreset) {
        return this.client.post(url, customPreset)
      }
      return this.client.get(url)
    }
    const chain = fromToken.chainId.toString()
    const params = new URLSearchParams({
      fromTokenAddress: fromToken.address,
      toTokenAddress: toToken.address,
      amount: amount.toBigInt(fromToken.decimals).toString(10),
      walletAddress,
      enableEstimate: `${enableEstimate ?? false}`,
    })
    const url = `/proxy/direct/fusion/quoter/v2.0/${chain}/quote/receive?${params.toString()}`
    if (customPreset) {
      return this.client.post(url, customPreset)
    }
    return this.client.get(url)
  }

  @CacheActivePromise()
  getOrderStatus(): Promise<OrderStatusResult | null> {
    throw new Error('Method not implemented.')
  }

  @CacheActivePromise()
  cancelOrder(): Promise<Hash | null> {
    throw new Error('Method not implemented.')
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
