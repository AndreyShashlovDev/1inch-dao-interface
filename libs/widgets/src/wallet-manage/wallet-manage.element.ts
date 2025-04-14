import { lazyProvider } from '@1inch-community/core/lazy'
import { getMobileMatchMediaAndSubscribe } from '@1inch-community/core/lit-utils'
import { IWallet } from '@1inch-community/models'
import '@1inch-community/ui-components/card'
import { html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { when } from 'lit/directives/when.js'
import { controllerContext } from './context'
import './elements/wallet-list'
import { walletManageStyle } from './wallet-manage.style'

@customElement(WalletManageElement.tagName)
export class WalletManageElement extends LitElement {
  static tagName = 'inch-wallet-manage' as const

  static override styles = walletManageStyle

  @property({ type: Object, attribute: false }) controller?: IWallet

  @property({ type: Boolean }) showShadow?: boolean

  private readonly mobileMedia = getMobileMatchMediaAndSubscribe(this)

  private readonly context = lazyProvider(this, { context: controllerContext })

  protected override render() {
    if (!this.controller) {
      throw new Error(
        'For the inch-wallet-manage widget to work, you need to pass the controller corresponding to the interface in the controller field'
      )
    }
    if (!this.context.isInit) {
      this.context.set(this.controller)
    }
    const headerText = this.controller.isConnected ? 'Wallet management' : 'Connect wallet'

    return html`
      <inch-card showShadow="${ifDefined(this.showShadow)}" overlayView>
        ${when(
          !this.mobileMedia.matches,
          () => html` <inch-card-close-overlay></inch-card-close-overlay> `
        )}
        <inch-card-header headerText="${headerText}"></inch-card-header>
        <inch-wallet-list></inch-wallet-list>
      </inch-card>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [WalletManageElement.tagName]: WalletManageElement
  }
}
