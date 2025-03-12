import { CacheActivePromise } from '@1inch-community/core/decorators'
import {
  ChainId,
  GasPriceDto,
  IApplicationContext,
  IOneInchDevPortalCrossChainAdapter,
  IProxyClient,
  IToken,
  ITokenV2Dto,
  OrderStatusResult,
  ProxyResultBalance,
  ProxyResultTokenPrice,
  QuoteReceiveCustomPreset,
  QuoteResult,
} from '@1inch-community/models'
import { Address, type Hash } from 'viem'
import { CrossChainSDKFacade } from '../../sdk/cross-chain-sdk'
import { OneInchDevPortalCrossChainOnChainAdapter } from '../onchain/one-inch-dev-portal-cross-chain-onchain.adapter'
import { PrivateProxyClient } from './private-proxy-client'

export class OneInchDevPortalCrossChainPrivateProxyAdapter
  implements IOneInchDevPortalCrossChainAdapter
{
  private readonly client = new PrivateProxyClient()
  private readonly sdkFacade = new CrossChainSDKFacade()
  private readonly fallBackAdapter = new OneInchDevPortalCrossChainOnChainAdapter()

  async init(context: IApplicationContext): Promise<void> {
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
    } catch (e) {
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
    return this.client.get('/proxy/token-list')
  }

  @CacheActivePromise()
  async getTokenPrice(): Promise<ProxyResultTokenPrice> {
    return this.client.get('/proxy/token-price')
  }

  @CacheActivePromise()
  getQuote(
    fromToken: IToken,
    toToken: IToken,
    amount: bigint,
    walletAddress: Address,
    customPreset?: QuoteReceiveCustomPreset,
    enableEstimate?: boolean
  ): Promise<QuoteResult | null> {
    return this.sdkFacade.getQuote(
      fromToken,
      toToken,
      amount,
      walletAddress,
      customPreset,
      enableEstimate
    )
  }

  @CacheActivePromise()
  getOrderStatus(orderHash: Hash): Promise<OrderStatusResult | null> {
    return this.sdkFacade.getOrderStatus(orderHash)
  }

  @CacheActivePromise()
  cancelOrder(orderHash: Hash): Promise<Hash | null> {
    return this.sdkFacade.cancelOrder(orderHash)
  }

  getGasPrice(chainId: ChainId): Promise<GasPriceDto | null> {
    throw new Error('Method not implemented.')
  }

  getProxyClient(): IProxyClient {
    return this.client
  }
}
