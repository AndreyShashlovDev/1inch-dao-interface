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
export declare class OneInchDevPortalCrossChainPublicProxyAdapter
  implements IOneInchDevPortalCrossChainAdapter
{
  private readonly host
  private readonly apiToken
  private readonly client
  private readonly sdkFacade
  private readonly fallBackAdapter
  init(context: IApplicationContext): Promise<void>
  getBalances(chainIds: ChainId[], walletAddresses: Address[]): Promise<ProxyResultBalance>
  getTokenBalances(chainId: ChainId, walletAddress: Address, tokenAddress: Address): Promise<bigint>
  getTokenList(): Promise<ITokenV2Dto[]>
  getTokenPrice(): Promise<ProxyResultTokenPrice>
  getQuote(
    fromToken: IToken,
    toToken: IToken,
    amount: bigint,
    walletAddress: Address,
    customPreset?: QuoteReceiveCustomPreset,
    enableEstimate?: boolean
  ): Promise<QuoteResult | null>
  getOrderStatus(orderHash: Hash): Promise<OrderStatusResult | null>
  cancelOrder(orderHash: Hash): Promise<Hash | null>
  getGasPrice(chainId: ChainId): Promise<GasPriceDto | null>
  getProxyClient(): IProxyClient
}
