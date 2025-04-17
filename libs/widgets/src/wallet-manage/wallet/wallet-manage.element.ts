import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import './elements/wallet-list'
import { walletManageStyle } from './wallet-manage.style'

@customElement(WalletManageElement.tagName)
export class WalletManageElement extends LitElement {
  static tagName = 'inch-wallet-manage' as const

  static override styles = walletManageStyle

  protected override render() {
    return html` <inch-wallet-list></inch-wallet-list>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [WalletManageElement.tagName]: WalletManageElement
  }
}
