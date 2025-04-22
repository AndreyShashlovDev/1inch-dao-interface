import { lazyAppContextConsumer, lazyProvider } from '@1inch-community/core/lazy'
import { dispatchEvent, LitCustomEvent, observe } from '@1inch-community/core/lit-utils'
import { IToken, TokenType } from '@1inch-community/models'
import '@1inch-community/ui-components/card'
import { html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { defer, map } from 'rxjs'
import '../shared-elements/token-list'
import { selectTokenContext } from './context'

import './elements/select-token-header'
import { SelectTokenContext } from './select-token.context'
import { selectTokenStyle } from './select-token.style'

@customElement(SelectTokenElement.tagName)
export class SelectTokenElement extends LitElement {
  static tagName = 'inch-select-token' as const

  static override styles = selectTokenStyle

  @property({ type: String }) tokenType?: TokenType
  @property({ type: Boolean, attribute: true }) mobileView = false

  private readonly applicationContext = lazyAppContextConsumer(this)

  private readonly selectTokenContext = lazyProvider(this, { context: selectTokenContext })

  private readonly chainListView$ = defer(() => this.selectTokenContext.value.chainFilter$)
  private readonly tokenListFlatView$ = defer(
    () => this.selectTokenContext.value.tokenListFlatView$
  )
  private readonly activeAddress$ = defer(
    () => this.applicationContext.value.wallet.data.activeAddress$
  )
  private readonly searchToken$ = defer(() => this.selectTokenContext.value.searchToken$)

  private readonly tokenListType$ = this.tokenListFlatView$.pipe(
    map((state) => (state ? 'flat' : 'accordion'))
  )

  protected override render() {
    this.initContext()
    return html`
      <inch-token-list
        showFavoriteTokenToggle
        type="${observe(this.tokenListType$, 'accordion')}"
        @selectToken="${(event: LitCustomEvent<IToken>) => {
          this.selectTokenContext.value.onSelectToken(event.detail.value)
          dispatchEvent(this, 'backCard', null)
        }}"
        @changeSearchState="${(event: LitCustomEvent<boolean>) => {
          this.selectTokenContext.value.setSearchState(event.detail.value)
        }}"
        .searchFilter="${observe(this.searchToken$)}"
        .chainIds="${observe(this.chainListView$)}"
        .walletAddress="${observe(this.activeAddress$)}"
        .mobileView="${this.mobileView}"
        .header="${() => html`<inch-select-token-header></inch-select-token-header>`}"
      ></inch-token-list>
    `
  }

  private initContext() {
    const swapContext = this.applicationContext.value.getActiveSwapContext()
    if (this.selectTokenContext.isInit || !swapContext || !this.tokenType) {
      throw new Error('error of init SelectTokenContext')
    }
    const context = new SelectTokenContext(
      this.tokenType,
      this.applicationContext.value,
      swapContext
    )
    this.selectTokenContext.set(context)
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [SelectTokenElement.tagName]: SelectTokenElement
  }
}
