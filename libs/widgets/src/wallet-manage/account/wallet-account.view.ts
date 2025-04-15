import { getMobileMatchMediaAndSubscribe } from '@1inch-community/core/lit-utils'
import { ITokenStorage, IWallet, IWalletAccountContext } from '@1inch-community/models'
import '@1inch-community/ui-components/button'
import '@1inch-community/ui-components/card'
import { provide } from '@lit/context'
import { html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { when } from 'lit/directives/when.js'
import { walletAccountContext } from './context'
import './elements/wallet-account-header'
import './elements/wallet-account-token-list'
import { walletAccountViewStyle } from './wallet-account-view.style'
import { WalletAccountContext } from './wallet-account.context'

@customElement(WalletAccountView.tagName)
export class WalletAccountView extends LitElement {
  static readonly tagName = 'inch-wallet-account-view' as const

  static override styles = walletAccountViewStyle

  @property({ type: Object, attribute: false }) walletController!: IWallet

  @property({ type: Object, attribute: false }) tokenStorageController!: ITokenStorage

  @property({ type: Boolean }) showShadow?: boolean

  private readonly mobileMedia = getMobileMatchMediaAndSubscribe(this)

  @provide({ context: walletAccountContext })
  walletAccountContext!: IWalletAccountContext

  private initContext() {
    if (!this.walletController || !this.tokenStorageController) {
      return
    }

    this.walletAccountContext = new WalletAccountContext(
      this.walletController,
      this.tokenStorageController
    )
  }

  protected override render() {
    if (!this.walletController || !this.tokenStorageController) {
      throw new Error(
        'For the inch-wallet-account widget to work, you need to pass the walletController and tokenStorageController' +
          ' corresponding to the interface in the controller field'
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
        <inch-card-header headerTextPosition="left" headerText="Account">
          <inch-button
              slot="right-container"
              @click="${() => {}}"
              type="secondary"
              size="l"
          >
             <inch-icon icon="plus24"></inch-icon>
          </inch-button>
        </inch-card-header>
        <inch-wallet-account-token-list
            .header="${() => html`
              <inch-wallet-account-header></inch-wallet-account-header> `}"
        ></inch-wallet-account-token-list>
      </inch-card>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inch-wallet-account-view': WalletAccountView
  }
}
