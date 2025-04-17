import { ChainId } from '@1inch-community/models'
import type { Address } from 'viem'

export type RepositoryPayload = {
  signal: AbortSignal
  chainId?: ChainId
  symbol?: string
  address?: Address
}
export type Repository = (payload: RepositoryPayload) => Promise<HTMLImageElement>
