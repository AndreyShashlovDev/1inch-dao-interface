import { formatHex } from '@1inch-community/core/formatters'
import { lazyAppContextConsumer } from '@1inch-community/core/lazy'
import { dispatchEvent, translate } from '@1inch-community/core/lit-utils'
import { EIP6963ProviderInfo } from '@1inch-community/models'
import '@1inch-community/ui-components/button'
import '@1inch-community/ui-components/chip'
import '@1inch-community/ui-components/icon'
import { html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'
import { Address } from 'viem'
import { walletDisconnectViewStyle } from './wallet-disconnect-view.style'

@customElement(WalletDisconnectViewElement.tagName)
export class WalletDisconnectViewElement extends LitElement {
  static tagName = 'inch-wallet-disconnect-view' as const

  static override styles = walletDisconnectViewStyle

  @property({ type: Object }) info?: EIP6963ProviderInfo
  @property({ type: String }) address?: Address

  private readonly applicationContext = lazyAppContextConsumer(this)

  private getMessageView() {
    if (this.address) {
      return html`${translate('widgets.wallet-disconnect.msg.single-wallet')}`
    }

    if (!this.info && !this.address) {
      return html`${translate('widgets.wallet-disconnect.msg.all-wallets')}`
    }
  }

  private onCancelClick() {
    dispatchEvent(this, 'onBackClick', null)
  }

  protected override render() {
    const connected = this.applicationContext.value.wallet.isConnected

    return html`
      <div class="wallet-disconnect-container">
        <div class="wallet-disconnect-content">
          <inch-icon icon="disconnectImageBig"></inch-icon>
          ${when(
            this.address,
            (address) => html`
              <div class="wallet-disconnect-content-chip">
                <inch-chip value="${formatHex(address)}"></inch-chip>
              </div>
            `
          )}

          <div class="wallet-disconnect-content-msg">${this.getMessageView()}</div>
        </div>

        <div class="wallet-disconnect-actions">
          <inch-button
            class="bnt-action__resize"
            @click="${() => {}}"
            type="primary-critical"
            size="xl"
            fullsize
          >
            ${translate('widgets.wallet-disconnect.button.disconnect')}
          </inch-button>
          <inch-button
            class="bnt-action__resize"
            @click="${() => this.onCancelClick()}}"
            type="secondary-gray"
            size="xl"
            fullsize
          >
            ${translate('widgets.wallet-disconnect.button.cancel')}
          </inch-button>
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [WalletDisconnectViewElement.tagName]: WalletDisconnectViewElement
  }
}
