import { Observable } from 'rxjs'
import { Address } from 'viem'
import { ChainId } from '../chain'
import type { ITokenListViewData } from '../token'

export interface IWalletAccountContext {
  readonly connectedWalletAddress$: Observable<Address | null>
  readonly chainId$: Observable<ChainId | null>
  readonly tokenViewData$: Observable<ITokenListViewData>
}
