import {
  ChainId,
  IToken,
  ITokenTransferRequirementResolver,
  ITransferRequirementResolver,
  ResolverResult,
} from '@1inch-community/models'
import { Address } from 'viem'

export class TokenTransferRequirementResolver implements ITokenTransferRequirementResolver {
  constructor(private readonly providers: Map<string, ITransferRequirementResolver<unknown>>) {}

  async provideRequirements(
    chainId: ChainId,
    walletAddress: Address,
    token: Address | IToken,
    amount: bigint
  ): Promise<ResolverResult<unknown> | null> {
    console.log(this.providers)
    // check already simple approve for oneInchRouter if support
    if (await this.justCheckOneInchApproveBefore()) {
      return null
    }

    for (const [name, provider] of this.providers) {
      console.log('try', name)
      const alreadyProvided = await provider.requirementProvided(
        chainId,
        walletAddress,
        token,
        amount
      )

      console.log(name, 'alreadyProvided', alreadyProvided)
      if (!alreadyProvided) {
        try {
          return {
            resolver: name,
            result: await provider.provideRequirements(chainId, walletAddress, token, amount),
          }
        } catch (e) {
          console.log(e)
        }
      }
    }

    return null
  }

  private async justCheckOneInchApproveBefore(): Promise<boolean> {
    return false
  }
}
