import type { Address } from 'viem'

export interface FusionPlusQuoteReceiveDto {
  quoteId: string | null
  srcEscrowFactory: Address
  srcSafetyDeposit: string
  srcTokenAmount: string
  recommendedPreset: string
  dstEscrowFactory: Address
  dstSafetyDeposit: Address
  dstTokenAmount: string
  k: number
  mxK: number
  priceImpactPercent: number
  autoK: number
  presets: Record<string, FusionPlusPresetDto>
}

export interface FusionPlusPresetDto {
  auctionDuration: number
  auctionEndAmount: string
  auctionStartAmount: string
  bankFee: string
  initialRateBump: number
  points: { delay: number; coefficient: number }[]
  startAuctionIn: number
  tokenFee: string
  startAmount: string
  gasCost: { gasBumpEstimate: number; gasPriceEstimate: string }
}
