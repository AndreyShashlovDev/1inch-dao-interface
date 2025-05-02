import { IOnChain, ITransferRequirementResolver, IWallet } from '@1inch-community/models'
import { OneInchApproveTransferResolver } from './one-inch-approve-transfer-resolver'
import { Permit2TransferResolver } from './permit2-transfer-resolver'

export type SupportTransferResolvers = '1InchApprove' | 'Permit2'

export class TransferResolverFactory {
  public static createDefault(
    onchain: IOnChain,
    wallet: IWallet
  ): Map<SupportTransferResolvers, ITransferRequirementResolver<unknown>> {
    return new Map<SupportTransferResolvers, ITransferRequirementResolver<unknown>>([
      ['Permit2', new Permit2TransferResolver(onchain, wallet)],
      ['1InchApprove', new OneInchApproveTransferResolver()],
    ])
  }
}
