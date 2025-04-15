import { formatHex } from '@1inch-community/core/formatters'
import { subscribe, translate } from '@1inch-community/core/lit-utils'
import { EIP6963ProviderInfo, IWalletAccountContext } from '@1inch-community/models'
import '@1inch-community/ui-components/button'
import '@1inch-community/ui-components/icon'
import { consume } from '@lit/context'
import { html, LitElement } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'
import { combineLatest, distinctUntilChanged, filter, tap } from 'rxjs'
import '../../../elements/wallet-view-address-balance'
import { walletAccountContext } from '../../context'
import '../../i18n'
import { walletAccountCardStyle } from './wallet-account-card.style'

@customElement(WalletAccountCardElement.tagName)
export class WalletAccountCardElement extends LitElement {
  static readonly tagName = 'inch-wallet-account-card' as const

  static override styles = [walletAccountCardStyle]

  @consume({ context: walletAccountContext })
  context?: IWalletAccountContext

  @state()
  private walletAddress?: string

  @state()
  private walletInfo?: EIP6963ProviderInfo

  protected override firstUpdated() {
    if (!this.context) {
      throw new Error('setup context before')
    }

    subscribe(
      this,
      [
        combineLatest(this.context.connectedWalletAddress$, this.context.connectedWalletInfo$).pipe(
          distinctUntilChanged(),
          filter(([address, info]) => address !== null && info !== null),
          tap(([address, info]) => {
            this.walletAddress = (address && formatHex(address)) ?? undefined
            this.walletInfo = info!
          })
        ),
      ],
      { requestUpdate: false }
    )
  }

  protected override render() {
    return html`
      <div class="card">
        <inch-icon class='background-unicorn' icon="unicornBackground"></inch-icon>
        
        <div class="card-wallet-container">
          <div class="card-wallet ${this.walletInfo && this.walletAddress ? '' : 'loader'}">
            ${when(
                this.walletInfo && this.walletAddress,
                () => html`
                  <div class="card-wallet-icon">
                  <img
                      class="wallet-icon"
                      alt="${this.walletInfo?.name}"
                      src="${this.walletInfo?.icon}"
                  />
                </div>
                <div class="card-wallet-address">${this.walletAddress}</div>

                <inch-button @click="${() => {}}" type="tertiary" size="xs">
                  <inch-icon icon="swap24"></inch-icon>
                </inch-button>
                `
            )}
          </div>

          <inch-button @click="${() => {}}" type="tertiary" size="xs">
            <inch-icon icon="more24"></inch-icon>
          </inch-button>
        </div>
        <div>
          <inch-wallet-view-address-balance></inch-wallet-view-address-balance>
        </div>

        <div class="card-actions">
          <inch-button @click="${() => {}}" type="tertiary" fullSize="${true}" size="l">
            <inch-icon class="btn-send-icon-arrow" icon="arrowLeft24"></inch-icon>
            ${translate(`widgets.wallet-account-view.card.send`)}
          </inch-button>

          <inch-button @click="${() => {}}" type="tertiary" fullSize="${true}" size="l">
            <inch-icon class="btn-receive-icon-arrow" icon="arrowLeft24"></inch-icon>
            ${translate(`widgets.wallet-account-view.card.receive`)}
          </inch-button>
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inch-wallet-account-card': WalletAccountCardElement
  }
}
