import type { Address } from 'viem'
import type { ChainId } from '../chain'

export type BaseQueryFilters = {
  symbol: string
  chainIds: ChainId[]
  tokenNameSymbolAddressMatches: string
  tokensOnlyWithBalance: boolean
  tokenAddress: Address
  walletAddress: Address
}

export type QueryFilters<
  RequiredKeys extends keyof BaseQueryFilters = never,
  NullableKeys extends keyof BaseQueryFilters = never,
> = {
  [K in RequiredKeys]: BaseQueryFilters[K]
} & {
  [K in NullableKeys]: BaseQueryFilters[K] | null
}
