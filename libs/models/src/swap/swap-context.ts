import { type Observable } from 'rxjs'
import { type Address, type Hash } from 'viem'
import { NullableValue } from '../base'
import { IBigFloat } from '../big-float'
import { ChainId } from '../chain'
import { IToken } from '../token'
import { Rate } from '../token-price'
import { IAmountDataSource } from './amount-data-source'
import { SwapOrderStatus } from './swap-order-status'
import { SwapSettings } from './swap-settings'
import { SwapSnapshot } from './swap-snapshot'

export type SettingsValue = {
  type: 'auto' | 'custom' | 'preset'
  value: number | null
}

export interface ISwapContext extends IAmountDataSource {
  readonly rate$: Observable<Rate | null>
  readonly minReceive$: Observable<IBigFloat>
  readonly chainId$: Observable<ChainId | null>
  readonly connectedWalletAddress$: Observable<Address | null>
  readonly slippage$: Observable<SettingsValue>
  readonly auctionTime$: Observable<SettingsValue>
  readonly loading$: Observable<boolean>
  destroy(): void
  setPair(pair: NullableValue<Pair>): void
  setToken(tokenType: TokenType, token: IToken): void
  switchPair(): void
  getTokenByType(type: 'source' | 'destination'): Observable<IToken | null>
  getTokenAmountByType(type: 'source' | 'destination'): Observable<IBigFloat | null>
  getTokenRawAmountByType(type: 'source' | 'destination'): Observable<IBigFloat | null>
  setTokenAmountByType(type: 'source' | 'destination', value: IBigFloat, markDirty?: boolean): void
  getSettingsController<V extends keyof SwapSettings>(name: V): SwapSettings[V]
  swap(swapSnapshot: SwapSnapshot): Promise<Hash>
  wrapNativeToken(amount: IBigFloat): Promise<void>
  getSnapshot(): Promise<SwapSnapshot>
  setMaxAmount(): Promise<void>
  getApprove(): Promise<Hash>
  getPermit(): Promise<void>
  getOrderStatus(orderHash: Hash): Promise<SwapOrderStatus>
  cancelOrder(orderHash: Hash): Promise<Hash | null>
}

export type Pair = {
  source: IToken
  destination: IToken
}

export type TokenType = keyof Pair
