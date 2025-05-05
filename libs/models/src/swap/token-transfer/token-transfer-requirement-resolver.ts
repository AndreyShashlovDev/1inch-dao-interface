import { Address } from 'viem'
import { ChainId } from '../../chain'
import { EmptyResult, ResolverStep } from './transfer-requirement-resolver'

export interface ResolverResult {
  resolver: string
  result: ResolverStep<string, EmptyResult>[] | null
}

export interface ITokenTransferRequirementResolver {
  provideRequirements(
    chainId: ChainId,
    walletAddress: Address,
    token: Address,
    amount: bigint
  ): Promise<ResolverResult | null>
}
