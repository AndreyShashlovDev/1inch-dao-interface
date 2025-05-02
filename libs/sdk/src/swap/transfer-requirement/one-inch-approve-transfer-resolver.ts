import { ChainId, IToken, ITransferRequirementResolver } from '@1inch-community/models'
import { Address } from 'viem'

export class OneInchApproveTransferResolver implements ITransferRequirementResolver<void> {
  public provideRequirements(
    chainId: ChainId,
    walletAddress: Address,
    token: Address | IToken,
    amount: bigint
  ): Promise<void> {
    throw new Error('not implemented yet!')
  }

  public requirementProvided(
    chainId: ChainId,
    walletAddress: Address,
    token: Address | IToken,
    amount: bigint
  ): Promise<boolean> {
    throw new Error('not implemented yet!')
  }
}
