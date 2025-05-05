import {
  IAmountDataSource,
  IApplicationContext,
  ISwapContextStrategy,
  SwapSettings,
} from '@1inch-community/models'
import { OneInchCrossChainSDK, OneInchSingleChainSDK } from '../../one-inch-dev-portal/sdk'
import { SwapContextFusionPlusStrategy } from './swap-context-fusion-plus.strategy'
import { SwapContextFusionStrategy } from './swap-context-fusion.strategy'
import { SwapContextOnChainStrategy } from './swap-context-onchain.strategy'

export class SwapStrategyFactory {
  public static createDefault(
    context: IApplicationContext,
    amountDataSource: IAmountDataSource,
    swapSettings: SwapSettings
  ): ISwapContextStrategy<unknown>[] {
    return [
      new SwapContextFusionPlusStrategy(
        new OneInchCrossChainSDK(context),
        amountDataSource,
        swapSettings
      ),
      new SwapContextFusionStrategy(
        new OneInchSingleChainSDK(context),
        amountDataSource,
        swapSettings
      ),
      new SwapContextOnChainStrategy(context.tokenRateProvider),
    ]
  }
}
