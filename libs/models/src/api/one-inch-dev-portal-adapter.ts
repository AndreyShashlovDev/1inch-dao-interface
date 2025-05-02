import type { OrderStatusResponse } from '@1inch/fusion-sdk'
import type { Address, Hash } from 'viem'
import { InitializingEntity } from '../base'
import { ChainId } from '../chain'
import { FusionQuoteReceiveDto, GasPriceDto, ITokenDto, ITokenV2Dto } from '../dto'
import { IProxyClient } from './proxy-client'
import { ProxyResultBalance, ProxyResultTokenPrice } from './proxy-result'

export type QuoteReceiveCustomPreset = {
  auctionDuration: number
  auctionStartAmount: string
  auctionEndAmount: string
  points: { toTokenAmount: string; delay: number }[]
}

/**
 * @deprecated
 * */
export interface IOneInchDevPortalAdapter extends InitializingEntity {
  getWhiteListedTokens(chainId: ChainId): Promise<ITokenDto[]>
  getGasPrice(chainId: ChainId): Promise<GasPriceDto | null>
  getFusionQuoteReceive(
    chainId: ChainId,
    fromTokenAddress: Address,
    toTokenAddress: Address,
    amount: bigint,
    walletAddress: Address,
    customPreset?: QuoteReceiveCustomPreset,
    enableEstimate?: boolean
  ): Promise<FusionQuoteReceiveDto | null>
  getTokenPrices(chainId: ChainId): Promise<Record<Address, string>>
  getBalancesByWalletAddress(
    chainId: ChainId,
    walletAddress: Address
  ): Promise<Record<Address, string>>
  getFusionOrderStatus(chainId: ChainId, orderHash: Hash): Promise<OrderStatusResponse>
  cancelFusionOrder(chainId: ChainId, orderHash: Hash): Promise<Hash>
}
/**
 * @deprecated
 * */
export interface IOneInchDevPortalCrossChainAdapter extends InitializingEntity {
  getBalances(chainIds: ChainId[], walletAddresses: Address[]): Promise<ProxyResultBalance>
  getTokenBalances(chainId: ChainId, walletAddress: Address, tokenAddress: Address): Promise<bigint>
  getTokenPrice(chainIds: ChainId[]): Promise<ProxyResultTokenPrice>
  getTokenList(): Promise<ITokenV2Dto[]>
  getGasPrice(chainId: ChainId): Promise<GasPriceDto | null>
  getProxyClient(): IProxyClient
  getOrderStatus(orderHash: Hash): Promise<OrderStatusResult | null>
  cancelOrder(orderHash: Hash): Promise<Hash | null>
}

export enum OrderStatus {
  Pending = 'pending',
  Executed = 'executed',
  Expired = 'expired',
  Cancelled = 'cancelled',
  Refunding = 'refunding',
  Refunded = 'refunded',
}

export interface OrderStatusResult {
  status: OrderStatus
  makerTraits: string
  fromTokenAddress: Address
  toTokenAddress: Address
  takingAmount: bigint
  makingAmount: bigint
  auctionDuration: number
  auctionStartDate: number
}
