import { CacheActivePromise } from '@1inch-community/core/decorators'
import { getEnvironmentValue } from '@1inch-community/core/environment'
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
  ProxyResultBalanceItem,
  ProxyResultTokenPrice,
  ProxyResultTokenPriceItem,
  QuoteReceiveCustomPreset,
  QuoteResult,
} from '@1inch-community/models'
import { Address, type Hash } from 'viem'
import { getChainIdList } from '../../../chain/chain-id-list'
import { CrossChainSDKFacade } from '../../sdk/cross-chain-sdk'
import { OneInchDevPortalCrossChainOnChainAdapter } from '../onchain'
import { PublicProxyClient } from './public-proxy-client'

export class OneInchDevPortalCrossChainPublicProxyAdapter
  implements IOneInchDevPortalCrossChainAdapter
{
  private readonly host: string = getEnvironmentValue('oneInchDevPortalHost')
  private readonly apiToken = getEnvironmentValue('oneInchDevPortalToken')
  private readonly client = new PublicProxyClient(this.host, this.apiToken)
  private readonly sdkFacade = new CrossChainSDKFacade()
  private readonly fallBackAdapter = new OneInchDevPortalCrossChainOnChainAdapter()

  async init(context: IApplicationContext): Promise<void> {
    await Promise.all([
      this.client.init(),
      this.sdkFacade.init(context),
      this.fallBackAdapter.init(context),
    ])
  }

  @CacheActivePromise()
  async getBalances(chainIds: ChainId[], walletAddresses: Address[]): Promise<ProxyResultBalance> {
    const pending: Promise<ProxyResultBalanceItem>[] = []

    for (const chainId of chainIds) {
      for (const walletAddress of walletAddresses) {
        pending.push(
          this.client
            .get<Record<string, string>>(`/balance/v1.2/${chainId}/balances/${walletAddress}`)
            .then((response) => {
              return {
                id: [chainId, walletAddress].join(':'),
                result: response,
                error: null,
              } satisfies ProxyResultBalanceItem
            })
            .catch((error: Error) => {
              return {
                id: [chainId, walletAddress].join(':'),
                result: null,
                error: {
                  code: 0,
                  message: error.message,
                },
              } satisfies ProxyResultBalanceItem
            })
        )
      }
    }

    return await Promise.all(pending)
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
    return this.client.get('/token/v1.2/multi-chain')
  }

  @CacheActivePromise()
  async getTokenPrice(): Promise<ProxyResultTokenPrice> {
    const chains = getChainIdList()
    return Promise.all(
      chains.map(async (chainId) => {
        const result = await this.client.get<Record<Address, string>>(
          `/price/v1.1/${chainId}?currency=USD`
        )
        return {
          id: chainId.toString(),
          result,
          error: null,
        } satisfies ProxyResultTokenPriceItem
      })
    )
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
