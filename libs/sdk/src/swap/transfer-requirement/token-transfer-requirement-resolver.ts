import {
  ChainId,
  EmptyResult,
  ITokenTransferRequirementResolver,
  ITransferRequirementResolver,
  ResolverResult,
} from '@1inch-community/models'
import { Address } from 'viem'

export class TokenTransferRequirementResolver<K extends string>
  implements ITokenTransferRequirementResolver
{
  constructor(
    private readonly providers: Map<K, ITransferRequirementResolver<string, EmptyResult>>,
    private readonly fallbackResolverName: K
  ) {}

  async provideRequirements(
    chainId: ChainId,
    walletAddress: Address,
    token: Address,
    amount: bigint
  ): Promise<ResolverResult | null> {
    const fallbackResolver = this.providers.get(this.fallbackResolverName)

    if (
      fallbackResolver &&
      (await fallbackResolver.requirementProvided(chainId, walletAddress, token, amount))
    ) {
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
}
