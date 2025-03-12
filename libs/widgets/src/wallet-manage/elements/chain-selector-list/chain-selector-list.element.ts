import { getMobileMatchMediaAndSubscribe, subscribe } from '@1inch-community/core/lit-utils'
import { ChainId, IWallet } from '@1inch-community/models'
import '@1inch-community/ui-components/card'
import '@1inch-community/ui-components/scroll'
import { html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { tap } from 'rxjs'
import { chainList } from '../../chain-view-config'
import '../chain-selector-list-item'
import { chainSelectorListStyle } from './chain-selector-list.style'

@customElement(ChainSelectorListElement.tagName)
export class ChainSelectorListElement extends LitElement {
  static tagName = 'inch-chain-selector-list' as const

  static override styles = [chainSelectorListStyle]

  @property({ type: Object, attribute: false }) wallet?: IWallet

  @state() activeChainId?: ChainId

  private readonly mobileMedia = getMobileMatchMediaAndSubscribe(this)

  protected override firstUpdated() {
    if (!this.wallet) throw new Error('')
    subscribe(
      this,
      [
        this.wallet.data.chainId$.pipe(
          tap((chainId) => (this.activeChainId = chainId ?? undefined))
        ),
      ],
      { requestUpdate: false }
    )
  }

  protected override render() {
    return this.mobileMedia.matches ? this.getMobileList() : this.getDesktopList()
  }

  private getList() {
    return chainList.map(
      (info) => html`
        <inch-chain-selector-list-item
          .info="${info}"
          .controller="${this.wallet}"
          activeChainId="${ifDefined(this.activeChainId)}"
        ></inch-chain-selector-list-item>
      `
    )
  }

  private getMobileList() {
    return html`
      <inch-card class="card" forMobileView>
        <inch-card-header closeButton headerText="Select chain"></inch-card-header>
        <inch-scroll-view-consumer> ${this.getList()} </inch-scroll-view-consumer>
      </inch-card>
    `
  }

  private getDesktopList() {
    return html` <inch-card> ${this.getList()} </inch-card> `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inch-chain-selector-list': ChainSelectorListElement
  }
}
