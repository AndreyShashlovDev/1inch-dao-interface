import { lazyConsumer } from '@1inch-community/core/lazy'
import { LitCustomEvent, observe } from '@1inch-community/core/lit-utils'
import { ChainId } from '@1inch-community/models'
import { scrollContext } from '@1inch-community/ui-components/scroll'
import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import { defer } from 'rxjs'
import '../../../chain-selector'
import { selectTokenContext } from '../../context'
import '../favorite-tokens'
import '../search-token-input'
import { selectTokenHeaderStyle } from './select-token-header.style'

@customElement(SelectTokenHeaderElement.tagName)
export class SelectTokenHeaderElement extends LitElement {
  static tagName = 'inch-select-token-header' as const

  static override styles = selectTokenHeaderStyle

  private readonly selectTokenContext = lazyConsumer(this, { context: selectTokenContext })
  private readonly scrollContext = lazyConsumer(this, { context: scrollContext })

  private readonly chainListView$ = defer(() => this.selectTokenContext.value.chainFilter$)

  protected render() {
    return html`
      <div style="margin-left: 1px; margin-right: 1px; pointer-events: auto;">
        <inch-card-header backButton>
          <inch-chain-selector
            slot="center-container"
            .selectedChainIdList="${observe(this.chainListView$)}"
            @changeSelectedChainIdList="${(event: LitCustomEvent<ChainId[]>) =>
              this.selectTokenContext.value.onChangeChainFilter(event.detail.value)}"
          ></inch-chain-selector>
        </inch-card-header>
        <inch-search-token-input></inch-search-token-input>
        <inch-favorite-tokens></inch-favorite-tokens>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [SelectTokenHeaderElement.tagName]: SelectTokenHeaderElement
  }
}
