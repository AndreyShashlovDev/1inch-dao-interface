import { getMobileMatchMediaAndSubscribe } from '@1inch-community/core/lit-utils'
import '@1inch-community/ui-components/card'
import { IApplicationContext, IWalletAccountContext } from '@1inch-community/models'
import { provide } from '@lit/context'
import { html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { when } from 'lit/directives/when.js'
import { walletAccountContext } from './context'
import { walletAccountViewStyle } from './wallet-account-view.style'
import './elements/wallet-account-token-list'
import { WalletAccountContext } from './wallet-account.context'
import './elements/wallet-account-header'

@customElement(WalletAccountView.tagName)
export class WalletAccountView extends LitElement {
  static readonly tagName = 'inch-wallet-account-vew' as const

  static override styles = walletAccountViewStyle
  @property({ type: Object, attribute: false }) controller!: IApplicationContext

  @property({ type: Boolean }) showShadow?: boolean

  private readonly mobileMedia = getMobileMatchMediaAndSubscribe(this)

  @provide({ context: walletAccountContext })
  walletAccountContext!: IWalletAccountContext

  private initContext() {
    if (!this.controller) {
      return
    }

    this.walletAccountContext = new WalletAccountContext(
      this.controller
    )
  }

  protected override render() {
    if (!this.controller) {
      throw new Error(
        'For the inch-wallet-manage widget to work, you need to pass the controller corresponding to the interface in the controller field'
      )
    }

    this.initContext()

    return html`
      <inch-card showShadow="${ifDefined(this.showShadow)}" overlayView>
        ${when(
            !this.mobileMedia.matches,
            () => html`
              <inch-card-close-overlay></inch-card-close-overlay> `
        )}
        <inch-card-header headerTextPosition="left" headerText="Account"></inch-card-header>
        <inch-wallet-account-token-list
            header="${() => html`
              <inch-wallet-account-header></inch-wallet-account-header>
            `}"
        ></inch-wallet-account-token-list>
      </inch-card>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inch-wallet-account-vew': WalletAccountView
  }
}
