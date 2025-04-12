import { lazyAppContextConsumer } from '@1inch-community/core/lazy'
import { LitCustomEvent, observe, subscribe } from '@1inch-community/core/lit-utils'
import { ChainId, ISelectTokenContext, ISwapContext, TokenType } from '@1inch-community/models'
import { SwapContextToken } from '@1inch-community/sdk/swap'
import '@1inch-community/ui-components/card'
import { consume, provide } from '@lit/context'
import { html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { defer, tap } from 'rxjs'
import '../chain-selector'
import { selectTokenContext } from './context'
import './elements/favorite-tokens'
import './elements/search-token-input'
import './elements/token-list'
import { SelectTokenContext } from './select-token.context'
import { selectTokenStyle } from './select-token.style'

@customElement(SelectTokenElement.tagName)
export class SelectTokenElement extends LitElement {
  static tagName = 'inch-select-token' as const

  static override styles = selectTokenStyle

  @property({ type: String }) tokenType?: TokenType

  private readonly applicationContext = lazyAppContextConsumer(this)

  @consume({ context: SwapContextToken, subscribe: true })
  @property({ type: Object })
  swapContext?: ISwapContext

  @provide({ context: selectTokenContext })
  selectTokenContext!: ISelectTokenContext

  private isEmpty = true

  private readonly chainListView$ = defer(() => this.getChainFilter())

  protected override render() {
    const classes = {
      empty: this.isEmpty,
    }
    this.initContext()
    return html`
      <inch-token-list
        class="${classMap(classes)}"
        .header="${() => html`
          <div style="margin-left: 1px; margin-right: 1px; pointer-events: auto;">
            <inch-card-header backButton>
              <inch-chain-selector
                slot="center-container"
                .selectedChainIdList="${observe(this.chainListView$)}"
                @changeSelectedChainIdList="${(event: LitCustomEvent<ChainId[]>) =>
                  this.selectTokenContext.onChangeChainFilter(event.detail.value)}"
              ></inch-chain-selector>
            </inch-card-header>
            <inch-search-token-input></inch-search-token-input>
            <inch-favorite-tokens></inch-favorite-tokens>
          </div>
        `}"
      ></inch-token-list>
    `
  }

  protected override firstUpdated() {
    subscribe(this, [
      this.getTokenViewData().pipe(
        tap((data) => {
          this.isEmpty = data.allTokensInfo.length === 0 && data.userTokensInfo.length === 0
        })
      ),
    ])
  }

  private initContext() {
    if (this.selectTokenContext || !this.swapContext || !this.tokenType) return
    this.selectTokenContext = new SelectTokenContext(
      this.tokenType,
      this.applicationContext.value,
      this.swapContext
    )
  }

  private getTokenViewData() {
    if (!this.selectTokenContext) throw new Error('')
    return this.selectTokenContext.tokenViewData$
  }

  private getChainFilter() {
    if (!this.selectTokenContext) throw new Error('')
    return this.selectTokenContext.chainFilter$
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inch-select-token': SelectTokenElement
  }
}
