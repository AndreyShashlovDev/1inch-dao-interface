import { ChainId } from 'index'
import { Address } from 'viem'

export interface ResolverStepResult {
  status: 'error' | 'canceled' | 'success'
  error?: Error
}

export interface ResolverStep<S extends string, R extends ResolverStepResult> {
  alias: S
  wait: () => Promise<R>
}

export interface EmptyResult extends ResolverStepResult {}

export interface ITransferRequirementResolver<Step extends string, R extends ResolverStepResult> {
  requirementProvided(
    chainId: ChainId,
    walletAddress: Address,
    token: Address,
    amount: bigint
  ): Promise<boolean>

  provideRequirements(
    chainId: ChainId,
    walletAddress: Address,
    token: Address,
    amount: bigint
  ): Promise<ResolverStep<Step, R>[]>
}
