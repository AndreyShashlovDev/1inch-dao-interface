import { observe, subscribe } from '@1inch-community/core/lit-utils'
import { ChainId, ISelectTokenContext, ITokenListViewData } from '@1inch-community/models'
import { getChainById, isChainId } from '@1inch-community/sdk/chain'
import '@1inch-community/ui-components/icon'
import { ISceneContext, sceneContext } from '@1inch-community/ui-components/scene'
import '@1inch-community/ui-components/scroll'
import { consume } from '@lit/context'
import { html, LitElement, TemplateResult } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { when } from 'lit/directives/when.js'
import { defer, map, tap } from 'rxjs'
import { Address } from 'viem'
import { selectTokenContext } from '../../context'
import '../token-list-item'
import '../token-list-stub-item'
import { tokenListStyle } from './token-list.style'

@customElement(TokenListElement.tagName)
export class TokenListElement extends LitElement {
  static tagName = 'inch-token-list' as const

  static override styles = [tokenListStyle]

  @property({ type: Object }) header?: () => TemplateResult<1>

  @consume({ context: selectTokenContext })
  context?: ISelectTokenContext

  @consume({ context: sceneContext })
  sceneContext?: ISceneContext
  @state() private chainId: ChainId | null = null
  @state() private walletAddress: Address | null = null
  @state() private isEmpty = false

  private tokenViewDataSnapshot: ITokenListViewData | null = null

  private readonly tokenViewData$ = defer(() => this.getTokenViewData())

  private readonly indexList$ = this.tokenViewData$.pipe(
    map((data) => {
      const length = data.userTokensInfo.length + data.allTokensInfo.length
      return new Array(length).fill(0) as 0[]
    })
  )

  protected override render() {
    const searchValue = this.context?.getSearchTokenValue() ?? ''
    const searchValueExist = searchValue !== ''
    const unsupportedChainId = !isChainId(this.chainId)
    const chain = getChainById(this.chainId ?? ChainId.eth)
    return html`
      ${when(
        unsupportedChainId,
        () => html`
          <div class="overlay-message">
            <h3>Unsupported chain</h3>
          </div>
        `
      )}
      ${when(
        this.isEmpty && searchValueExist && !unsupportedChainId,
        () => html`
          <div class="overlay-message">
            <inch-icon icon="emptySearch"></inch-icon>
            <h3>Token not found on ${chain.name} Network</h3>
            <span>Try changing your search query, or switch to another Network</span>
          </div>
        `
      )}
      <inch-scroll-view-virtualizer-consumer
        .header="${this.header}"
        .items=${observe(this.indexList$, this.getStubAddresses())}
        .keyFunction="${(_: 0, index: number) => this.getListItemKeyByIndex(index)}"
        .renderItem=${(_: 0, index: number) => {
          const normalizedIndex = index - 1
          const record = this.extractTokenViewDataByIndex(normalizedIndex)
          if (!record) return html``
          return html`
            <inch-token-list-item
              .crossChainTokensBindingRecord="${record}"
              .walletAddress="${ifDefined(this.walletAddress ?? undefined)}"
            ></inch-token-list-item>
          `
        }}
      ></inch-scroll-view-virtualizer-consumer>
    `
  }

  protected override async firstUpdated() {
    subscribe(
      this,
      [
        this.getConnectedWalletAddress().pipe(tap((address) => (this.walletAddress = address))),
        this.getChainId().pipe(tap((chainId) => (this.chainId = chainId))),
      ],
      { requestUpdate: false }
    )
    subscribe(this, [
      this.tokenViewData$.pipe(
        tap((data) => {
          this.isEmpty = data.allTokensInfo.length === 0 && data.userTokensInfo.length === 0
          this.tokenViewDataSnapshot = data
        })
      ),
    ])
    subscribe(this, [this.getFavoriteTokens()])
  }

  private getTokenViewData() {
    if (!this.context) throw new Error('')
    return this.context.tokenViewData$
  }

  private getChainId() {
    if (!this.context) throw new Error('')
    return this.context.chainId$
  }

  private getFavoriteTokens() {
    if (!this.context) throw new Error('')
    return this.context.favoriteTokens$
  }

  private getConnectedWalletAddress() {
    if (!this.context) throw new Error('')
    return this.context.connectedWalletAddress$
  }

  private getStubAddresses() {
    return Array.from(Array(30)).map((_, index) => `0x${index.toString(16)}`)
  }

  private getListItemKeyByIndex(index: number): string {
    const record = this.extractTokenViewDataByIndex(index)
    if (!record) return ''
    return [record.symbol, index, ...record.tokenRecordIds].join('')
  }

  private extractTokenViewDataByIndex(index: number) {
    if (this.tokenViewDataSnapshot === null) return null
    if (index >= this.tokenViewDataSnapshot.userTokensInfo.length) {
      const allTokensInfoIndex = index - this.tokenViewDataSnapshot.userTokensInfo.length
      return this.tokenViewDataSnapshot.allTokensInfo[allTokensInfoIndex] ?? null
    }
    return this.tokenViewDataSnapshot.userTokensInfo[index]
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inch-token-list': TokenListElement
  }
}
