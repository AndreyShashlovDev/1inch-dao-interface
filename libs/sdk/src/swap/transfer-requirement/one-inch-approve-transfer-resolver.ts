import {
  ChainId,
  IToken,
  ITransferRequirementResolver,
  ResolverStep,
} from '@1inch-community/models'
import { Address } from 'viem'
import { StepName, StepResult } from './permit2-transfer-resolver'

interface EmptyResult {}

export type StepResultMap = {
  Approve: EmptyResult
}

export class OneInchApproveTransferResolver
  implements ITransferRequirementResolver<StepName, StepResult<StepName>>
{
  public async requirementProvided(
    chainId: ChainId,
    walletAddress: Address,
    token: Address | IToken,
    amount: bigint
  ): Promise<boolean> {
    return false
  }

  public provideRequirements(
    chainId: ChainId,
    walletAddress: Address,
    token: Address | IToken,
    amount: bigint
  ): Promise<ResolverStep<StepName, StepResult<StepName>>[]> {
    throw new Error('not implemented yet!')
  }
}
