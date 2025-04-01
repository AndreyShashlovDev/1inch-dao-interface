import { type Observable } from 'rxjs'
import { type Address } from 'viem'
import { ChainId } from '../chain'
import { IToken, type ITokenListViewData } from '../token'

export interface ISelectTokenContext {
  readonly chainId$: Observable<ChainId | null>
  readonly connectedWalletAddress$: Observable<Address | null>
  readonly favoriteTokens$: Observable<Address[]>
  readonly tokenViewData$: Observable<ITokenListViewData>
  readonly changeFavoriteTokenState$: Observable<[ChainId, Address]> // token info
  readonly searchInProgress$: Observable<boolean>
  setFavoriteTokenState(chainId: ChainId, address: Address, state: boolean): Promise<void>
  setSearchToken(state: string): void
  getSearchTokenValue(): string
  isOpenCrossChainView(symbol: string): boolean
  onOpenCrossChainView(symbol: string, isOpen: boolean): void
  onSelectToken(token: IToken): void
}
