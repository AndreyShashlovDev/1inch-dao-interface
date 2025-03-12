import {
  IApplicationContext,
  ICrossChainSDKFacade,
  IToken,
  OrderStatusResult,
  QuoteReceiveCustomPreset,
  QuoteResult,
} from '@1inch-community/models'
import { Address, type Hash } from 'viem'
export declare class CrossChainSDKFacade implements ICrossChainSDKFacade {
  private context?
  private sdk?
  init(context: IApplicationContext): Promise<void>
  getQuote(
    fromToken: IToken,
    toToken: IToken,
    amount: bigint,
    walletAddress: Address,
    customPreset?: QuoteReceiveCustomPreset,
    enableEstimate?: boolean
  ): Promise<QuoteResult | null>
  getOrderStatus(orderHash: Hash): Promise<OrderStatusResult | null>
  cancelOrder(orderHash: Hash): Promise<Hash | null>
  private buildSDK
}
