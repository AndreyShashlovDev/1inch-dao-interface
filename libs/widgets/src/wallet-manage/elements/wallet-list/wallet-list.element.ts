import { IWallet } from '@1inch-community/models'
import '@1inch-community/ui-components/icon'
import '@1inch-community/ui-components/scroll'
import { consume } from '@lit/context'
import { Task } from '@lit/task'
import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import { map } from 'lit/directives/map.js'
import { controllerContext } from '../../context'
import '../wallet-view'

@customElement(WalletListElement.tagName)
export class WalletListElement extends LitElement {
  static tagName = 'inch-wallet-list' as const

  @consume({ context: controllerContext })
  private wallet?: IWallet

  private readonly task = new Task(
    this,
    async () => await this.getController().getSupportedWallets(),
    () => []
  )

  protected override render() {
    return this.task.render({
      pending: () => html`<inch-icon icon="unicornRun"></inch-icon>`,
      complete: (infoList) => html`
        <inch-scroll-view-consumer>
          ${map(infoList, (info) => html`<inch-wallet-view .info="${info}"></inch-wallet-view>`)}
        </inch-scroll-view-consumer>
      `,
    })
  }

  private getController() {
    if (!this.wallet) {
      throw new Error('')
    }
    return this.wallet
  }
}
declare global {
  interface HTMLElementTagNameMap {
    'inch-wallet-list': WalletListElement
  }
}
