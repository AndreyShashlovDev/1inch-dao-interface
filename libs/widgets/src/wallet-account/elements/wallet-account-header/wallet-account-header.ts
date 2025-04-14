import { IWalletAccountContext } from '@1inch-community/models'
import { consume } from '@lit/context'
import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import { walletAccountContext } from '../../context'
import { walletAccountHeaderStyle } from './wallet-account-header.style'

@customElement(WalletAccountHeader.tagName)
export class WalletAccountHeader extends LitElement {
  static readonly tagName = 'inch-wallet-account-header' as const

  static override styles = [walletAccountHeaderStyle]

  @consume({ context: walletAccountContext })
  context?: IWalletAccountContext

  protected override render() {
    console.log('RENDERHEADER', this.context)
    return html`Header block`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inch-wallet-account-header': WalletAccountHeader
  }
}
