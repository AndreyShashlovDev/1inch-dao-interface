import { translate } from '@1inch-community/core/lit-utils'
import { IWalletAccountContext } from '@1inch-community/models'
import { consume } from '@lit/context'
import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import { walletAccountContext } from '../../context'
import '../../i18n'
import { walletAccountHeaderStyle } from './wallet-account-header.style'
import '../wallet-account-card'
import '../../../../chain-selector'
@customElement(WalletAccountHeaderElement.tagName)
export class WalletAccountHeaderElement extends LitElement {
  static readonly tagName = 'inch-wallet-account-header' as const

  static override styles = [walletAccountHeaderStyle]

  @consume({ context: walletAccountContext })
  context?: IWalletAccountContext

  protected override render() {
    return html`
      <div class='container'>
        <inch-wallet-account-card></inch-wallet-account-card>
        <div class='tokens-list-title-container'>
          <span class='tokens-list-title'>${translate(`widgets.wallet-account-view.tokens-list.title`)}</span>
          <inch-chain-selector></inch-chain-selector>
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inch-wallet-account-header': WalletAccountHeaderElement
  }
}
