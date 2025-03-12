import { changeMobileMatchMedia, getMobileMatchMedia } from '@1inch-community/core/lit-utils'
import { IWallet } from '@1inch-community/models'
import '@1inch-community/ui-components/card'
import { ContextProvider } from '@lit/context'
import { html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { controllerContext } from './context'
import './elements/wallet-list'
import { walletManageStyle } from './wallet-manage.style'

@customElement(WalletManageElement.tagName)
export class WalletManageElement extends LitElement {
  static tagName = 'inch-wallet-manage' as const

  static override styles = walletManageStyle

  @property({ type: Object, attribute: false }) controller?: IWallet

  @property({ type: Boolean }) showShadow?: boolean

  private readonly mobileMedia = getMobileMatchMedia()

  private readonly context = new ContextProvider(this, { context: controllerContext })

  protected override firstUpdated() {
    changeMobileMatchMedia(this)
  }

  protected override render() {
    if (!this.controller) {
      throw new Error(
        'For the inch-wallet-manage widget to work, you need to pass the controller corresponding to the interface in the controller field'
      )
    }
    if (!this.context.value) {
      this.context.setValue(this.controller)
    }
    const headerText = this.controller.isConnected ? 'Wallet management' : 'Connect wallet'

    return html`
      <inch-card
        showShadow="${ifDefined(this.showShadow)}"
        forMobileView="${ifDefined(this.mobileMedia.matches ? '' : undefined)}"
      >
        <inch-card-header closeButton headerText="${headerText}"></inch-card-header>
        <inch-wallet-list></inch-wallet-list>
      </inch-card>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inch-wallet-manage': WalletManageElement
  }
}
