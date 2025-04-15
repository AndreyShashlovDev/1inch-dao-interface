import { JsonParser } from '@1inch-community/core/storage'
import {
  ChainId,
  IApplicationContext,
  ISelectTokenContext,
  ISwapContext,
  IToken,
  TokenType,
} from '@1inch-community/models'
import { getChainIdList } from '@1inch-community/sdk/chain'
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  defer,
  distinctUntilChanged,
  mergeMap,
  Observable,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs'
import { type Address } from 'viem'

export class SelectTokenContext implements ISelectTokenContext {
  readonly chainId$: Observable<ChainId | null> = defer(
    () => this.applicationContext.wallet.data.chainId$
  )
  readonly connectedWalletAddress$: Observable<Address | null> = defer(
    () => this.applicationContext.wallet.data.activeAddress$
  )
  readonly searchToken$: BehaviorSubject<string> = new BehaviorSubject<string>('')
  readonly changeFavoriteTokenState$: Subject<[ChainId, Address]> = new Subject()
  readonly searchInProgress$: Subject<boolean> = new BehaviorSubject(false)
  readonly openCrossChainView$ = new BehaviorSubject<[string, boolean]>(['', false])
  readonly chainFilter$ = new BehaviorSubject<ChainId[]>([])

  readonly favoriteTokens$ = this.chainId$.pipe(
    mergeMap((chainId) => {
      if (chainId === null) return []
      return this.applicationContext.tokenStorage.liveQuery(() =>
        this.applicationContext.tokenStorage.getAllFavoriteTokenAddresses(chainId)
      )
    })
  )

  readonly tokenViewData$ = combineLatest([
    this.connectedWalletAddress$,
    this.chainFilter$,
    this.searchToken$.pipe(debounceTime(300), startWith(''), distinctUntilChanged()),
  ]).pipe(
    switchMap(([address, chainIds]: [Address | null, ChainId[], string]) => {
      return this.applicationContext.tokenStorage.liveQuery(() =>
        this.applicationContext.tokenStorage.getSymbolData(chainIds, address ?? undefined)
      )
    }),
    tap(() => this.searchInProgress$.next(false)),
    shareReplay({ bufferSize: 1, refCount: true })
  )

  constructor(
    private readonly tokenType: TokenType,
    private readonly applicationContext: IApplicationContext,
    private readonly swapContext: ISwapContext
  ) {
    const chainFilter =
      this.applicationContext.storage.get<ChainId[]>(
        'inch-select-token_chain-filter',
        JsonParser
      ) ?? getChainIdList()
    this.chainFilter$.next(chainFilter)
  }

  async setFavoriteTokenState(chainId: ChainId, address: Address, state: boolean): Promise<void> {
    await this.applicationContext.tokenStorage.setFavoriteState(chainId, address, state)
    this.changeFavoriteTokenState$.next([chainId, address])
  }

  setSearchToken(state: string): void {
    this.searchInProgress$.next(true)
    this.searchToken$.next(state)
  }

  getSearchTokenValue() {
    return this.searchToken$.value
  }

  onSelectToken(token: IToken) {
    this.swapContext.setToken(this.tokenType, token)
  }

  onChangeChainFilter(chainIdList: ChainId[]): void {
    this.chainFilter$.next(chainIdList)
    this.applicationContext.storage.set('inch-select-token_chain-filter', chainIdList)
  }

  getOpenCrossChainView() {
    return this.openCrossChainView$.value
  }

  onOpenCrossChainView(symbol: string, openMore: boolean) {
    this.openCrossChainView$.next([symbol, openMore])
  }
}
