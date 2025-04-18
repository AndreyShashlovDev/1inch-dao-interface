import { asyncTimeout } from '@1inch-community/core/async'
import { lazyAppContextConsumer } from '@1inch-community/core/lazy'
import { observe } from '@1inch-community/core/lit-utils'
import { ChainId, type ITokenListViewData, type TokenRecordId } from '@1inch-community/models'
import '@1inch-community/ui-components/scroll'
import type { ScrollViewVirtualizerConsumerElement } from '@1inch-community/ui-components/scroll'
import { html, LitElement, TemplateResult } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { createRef, ref } from 'lit/directives/ref.js'
import {
  asapScheduler,
  BehaviorSubject,
  combineLatest,
  map,
  Observable,
  observeOn,
  switchMap,
  tap,
} from 'rxjs'
import { Address } from 'viem'
import { changeSearchState } from '../events'
import '../token-item-cross-chain-accordion'
import '../token-item-cross-chain-flat'
import { tokenListStyle } from './token-list.style'

type TokenListByViewTypeAndSearchFilterAndChainIdsType = Observable<
  ITokenListViewData | TokenRecordId[]
>

type TokenListType = 'flat' | 'accordion'

@customElement(TokenListElement.tagName)
export class TokenListElement extends LitElement {
  static tagName = 'inch-token-list' as const

  static override styles = tokenListStyle

  @property({ type: Boolean, attribute: true }) showFavoriteTokenToggle = false
  @property({ type: Function, attribute: false }) header?: () => TemplateResult<1>

  @property({ type: String, attribute: true })
  set type(value: TokenListType) {
    this.type$.next(value)
  }

  @property({ type: Array, attribute: false })
  set chainIds(value: ChainId[]) {
    if (!Array.isArray(value)) return
    this.chainIds$.next(value)
  }

  @property({ type: String, attribute: false })
  set walletAddress(value: Address) {
    if (!value) return
    this.walletAddress$.next(value)
  }

  @property({ type: String, attribute: false })
  set searchFilter(value: string) {
    if (this.searchFilter$.value === value) return
    this.searchFilter$.next(value)
    if (!this.searchInProgress) {
      this.searchInProgress = true
      changeSearchState(this, this.searchInProgress)
    }
  }

  private searchInProgress = false

  @state() private expandedAccordionItemIndex: number | null = null

  private tokenListViewDataSnapshot: ITokenListViewData | null = null

  private readonly applicationContext = lazyAppContextConsumer(this)

  private readonly virtualizedRef = createRef<ScrollViewVirtualizerConsumerElement>()

  private readonly type$ = new BehaviorSubject<TokenListType>('accordion')
  private readonly walletAddress$ = new BehaviorSubject<Address | undefined>(undefined)
  private readonly chainIds$ = new BehaviorSubject<ChainId[]>([])
  private readonly searchFilter$ = new BehaviorSubject<string>('')

  private readonly tokenListByViewTypeAndSearchFilterAndChainIds$: TokenListByViewTypeAndSearchFilterAndChainIdsType =
    combineLatest([this.type$, this.searchFilter$, this.chainIds$, this.walletAddress$]).pipe(
      observeOn(asapScheduler),
      switchMap(([type, searchFilter, chainIds, walletAddress]) => {
        if (type === 'flat' || searchFilter.length > 0) {
          return this.applicationContext.value.tokenStorage.liveQuery(() =>
            this.applicationContext.value.tokenStorage.getTokenIdList(
              chainIds,
              searchFilter || undefined,
              walletAddress
            )
          )
        }
        if (type === 'accordion') {
          return this.applicationContext.value.tokenStorage.liveQuery(() =>
            this.applicationContext.value.tokenStorage.getSymbolData(chainIds, walletAddress)
          )
        }
        throw new Error(`TokenListElementError: Unknown type: ${type}`)
      })
    )

  private readonly dataIndexListOfFlatTokenIdList$ =
    this.tokenListByViewTypeAndSearchFilterAndChainIds$.pipe(
      map((data) => {
        if (Array.isArray(data)) {
          this.tokenListViewDataSnapshot = null
          return data
        }
        const length = data.userTokensInfo.length + data.allTokensInfo.length
        this.tokenListViewDataSnapshot = data
        return new Array(length).fill(0) as 0[]
      }),
      tap(() => {
        if (this.searchInProgress) {
          this.searchInProgress = false
          changeSearchState(this, this.searchInProgress)
        }
      })
    )

  protected render() {
    return html`
      <inch-scroll-view-virtualizer-consumer
        ${ref(this.virtualizedRef)}
        .header="${this.header}"
        .items=${observe(this.dataIndexListOfFlatTokenIdList$)}
        .keyFunction="${(id: TokenRecordId | 0, index: number) => this.keyFunction(id, index)}"
        .renderItem="${(id: TokenRecordId | 0, index: number) => this.renderItem(id, index)}"
      ></inch-scroll-view-virtualizer-consumer>
    `
  }

  private renderItem(id: TokenRecordId | 0, index: number): TemplateResult<1> {
    if (id === 0) {
      return this.renderAccordionItem(index)
    }
    if (typeof id === 'string') {
      return this.renderFlatItem(id)
    }
    throw new Error(`TokenListElementError: Unsupported template`)
  }

  private renderAccordionItem(index: number) {
    const record = this.extractTokenViewDataByIndex(index)
    const walletAddress = this.walletAddress$.value
    const chainIds = this.chainIds$.value
    return html`<inch-token-item-cross-chain-accordion
      @changeExpand="${() => this.changeExpandHandler(index)}"
      .showFavoriteTokenToggle="${this.showFavoriteTokenToggle}"
      .crossChainTokensBindingRecord="${record}"
      .walletAddress="${walletAddress}"
      .showChainIds="${chainIds}"
      .expanded="${this.expandedAccordionItemIndex === index}"
    ></inch-token-item-cross-chain-accordion>`
  }

  private renderFlatItem(id: TokenRecordId) {
    const walletAddress = this.walletAddress$.value
    return html` <inch-token-item-cross-chain-flat
      .showFavoriteTokenToggle="${this.showFavoriteTokenToggle}"
      .tokenId="${id}"
      .walletAddress="${walletAddress}"
    ></inch-token-item-cross-chain-flat>`
  }

  private keyFunction(id: TokenRecordId | 0, index: number): string {
    if (id === 0 && this.tokenListViewDataSnapshot !== null) {
      const record = this.extractTokenViewDataByIndex(index)!
      return [record.symbol, ...record.tokenRecordIds].join('')
    }
    if (typeof id === 'string') {
      return id
    }
    return index.toString()
  }

  private extractTokenViewDataByIndex(index: number) {
    if (this.tokenListViewDataSnapshot === null) return null
    if (index >= this.tokenListViewDataSnapshot.userTokensInfo.length) {
      const allTokensInfoIndex = index - this.tokenListViewDataSnapshot.userTokensInfo.length
      return this.tokenListViewDataSnapshot.allTokensInfo[allTokensInfoIndex] ?? null
    }
    return this.tokenListViewDataSnapshot.userTokensInfo[index]
  }

  private async changeExpandHandler(index: number) {
    if (this.expandedAccordionItemIndex === index) {
      this.expandedAccordionItemIndex = null
    } else {
      this.expandedAccordionItemIndex = index
      await asyncTimeout(300)
      this.virtualizedRef.value?.scrollToIndex(index)
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [TokenListElement.tagName]: TokenListElement
  }
}
