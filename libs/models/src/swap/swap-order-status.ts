import type { Address } from 'viem'

export enum OrderStatus {
  Pending = 'pending',
  Executed = 'executed',
  Expired = 'expired',
  Cancelled = 'cancelled',
  Refunding = 'refunding',
  Refunded = 'refunded',
}

export interface SwapOrderStatus {
  statusCode?: number
  status: OrderStatus
  makerTraits: string
  fromTokenAddress: Address
  toTokenAddress: Address
  takingAmount: bigint
  makingAmount: bigint
  auctionDuration: number
  auctionStartDate: number
}
