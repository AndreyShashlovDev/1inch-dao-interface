import { lazyAppContextConsumer } from '@1inch-community/core/lazy'
import { observe } from '@1inch-community/core/lit-utils'
import { IWalletAccountContext } from '@1inch-community/models'
import '@1inch-community/ui-components/button'
import '@1inch-community/ui-components/card'
import { provide } from '@lit/context'
import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import { defer } from 'rxjs'
import '../../shared-elements/token-list'
import { walletAccountContext } from './context'
import './elements/wallet-account-header'
import { walletAccountViewStyle } from './wallet-account-view.style'
import { WalletAccountContext } from './wallet-account.context'

@customElement(WalletAccountView.tagName)
export class WalletAccountView extends LitElement {
  static readonly tagName = 'inch-wallet-account-view' as const

  static override styles = walletAccountViewStyle

  private readonly applicationContext = lazyAppContextConsumer(this)

  @provide({ context: walletAccountContext })
  walletAccountContext!: IWalletAccountContext

  private readonly chainListView$ = defer(() => this.walletAccountContext.chainFilter$)
  private readonly activeAddress$ = defer(() => this.walletAccountContext.connectedWalletAddress$)

  private initContext() {
    if (!this.applicationContext) {
      return
    }

    this.walletAccountContext = new WalletAccountContext(
      this.applicationContext.value.wallet,
      this.applicationContext.value.tokenStorage,
      this.applicationContext.value.storage
    )
  }

  protected override render() {
    this.initContext()

    return html`
      <inch-card overlayView>
        <inch-token-list
          type="flat"
          .chainIds="${observe(this.chainListView$)}"
          .walletAddress="${observe(this.activeAddress$)}"
          .header="${() => html` <inch-wallet-account-header></inch-wallet-account-header>`}"
        ></inch-token-list>
      </inch-card>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inch-wallet-account-view': WalletAccountView
  }
}
