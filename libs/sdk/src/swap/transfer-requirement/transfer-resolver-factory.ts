import {
  EmptyResult,
  IOnChain,
  ITransferRequirementResolver,
  IWallet,
} from '@1inch-community/models'
import { OneInchApproveTransferResolver } from './one-inch-approve-transfer-resolver'
import { Permit2TransferResolver } from './permit2-transfer-resolver'

export type SupportTransferResolvers = '1InchApprove' | 'Permit2'

export class TransferResolverFactory {
  public static createDefault(
    onchain: IOnChain,
    wallet: IWallet
  ): Map<SupportTransferResolvers, ITransferRequirementResolver<string, EmptyResult>> {
    return new Map<SupportTransferResolvers, ITransferRequirementResolver<string, EmptyResult>>([
      ['Permit2', new Permit2TransferResolver(onchain, wallet)],
      ['1InchApprove', new OneInchApproveTransferResolver()],
    ])
  }
}
