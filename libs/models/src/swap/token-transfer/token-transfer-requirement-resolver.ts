import { Address } from 'viem'
import { ChainId } from '../../chain'
import { IToken } from '../../token'

export interface ResolverResult<T> {
  resolver: string
  result: T
}

export interface ITokenTransferRequirementResolver {
  provideRequirements(
    chainId: ChainId,
    walletAddress: Address,
    token: Address | IToken,
    amount: bigint
  ): Promise<ResolverResult<unknown> | null>
}
