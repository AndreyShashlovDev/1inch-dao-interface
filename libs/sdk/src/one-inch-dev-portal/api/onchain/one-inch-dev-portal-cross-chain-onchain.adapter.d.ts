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
  QuoteResult,
} from '@1inch-community/models'
import { Address, Hash } from 'viem'
export declare class OneInchDevPortalCrossChainOnChainAdapter
  implements IOneInchDevPortalCrossChainAdapter
{
  private context?
  init(context: IApplicationContext): Promise<void>
  getTokenBalances(chainId: ChainId, walletAddress: Address, tokenAddress: Address): Promise<bigint>
  getBalances(chainIds: ChainId[], walletAddresses: Address[]): Promise<ProxyResultBalance>
  getGasPrice(chainId: ChainId): Promise<GasPriceDto | null>
  getTokenPrice(): Promise<ProxyResultTokenPrice>
  getTokenList(): Promise<ITokenV2Dto[]>
  getProxyClient(): IProxyClient
  getQuote(): Promise<QuoteResult | null>
  getOrderStatus(orderHash: Hash): Promise<OrderStatusResult | null>
  cancelOrder(orderHash: Hash): Promise<Hash | null>
  private getBalancesMulticall
  private getBalancesHelper
}
