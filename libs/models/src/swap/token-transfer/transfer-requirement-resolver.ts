import { ChainId, IToken } from 'index'
import { Address } from 'viem'

export interface ITransferRequirementResolver<Result> {
  requirementProvided(
    chainId: ChainId,
    walletAddress: Address,
    token: Address | IToken,
    amount: bigint
  ): Promise<boolean>

  provideRequirements(
    chainId: ChainId,
    walletAddress: Address,
    token: Address | IToken,
    amount: bigint
  ): Promise<Result>
}
