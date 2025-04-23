import { lazyAppContextConsumer } from '@1inch-community/core/lazy'
import { translate } from '@1inch-community/core/lit-utils'
import '@1inch-community/ui-components/button'
import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'
import './elements/wallet-list'
import { walletManageStyle } from './wallet-manage.style'

@customElement(WalletManageElement.tagName)
export class WalletManageElement extends LitElement {
  static tagName = 'inch-wallet-manage' as const

  static override styles = walletManageStyle

  private readonly applicationContext = lazyAppContextConsumer(this)

  protected override render() {
    const connected = this.applicationContext.value.wallet.isConnected

    return html`
      <div class="wallet-manager-container">
        <inch-wallet-list></inch-wallet-list>

        ${when(
          connected,
          () => html`
            <div class="wallet-manager-actions">
              <inch-button
                class="bnt-action__resize"
                @click="${() => {}}"
                type="primary-critical"
                size="xl"
                fullsize
              >
                ${translate('widgets.wallet-manager.button.disconnect')}
              </inch-button>
            </div>
          `
        )}
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [WalletManageElement.tagName]: WalletManageElement
  }
}
