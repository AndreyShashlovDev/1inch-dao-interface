import { lazyAppContextConsumer } from '@1inch-community/core/lazy'
import '@1inch-community/ui-components/icon'
import '@1inch-community/ui-components/scroll'
import { Task } from '@lit/task'
import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import { map } from 'lit/directives/map.js'
import '../wallet-view'

@customElement(WalletListElement.tagName)
export class WalletListElement extends LitElement {
  static tagName = 'inch-wallet-list' as const

  private readonly applicationContext = lazyAppContextConsumer(this)

  private readonly task = new Task(
    this,
    async () => await this.getController().getSupportedWallets(),
    () => []
  )

  protected override render() {
    return this.task.render({
      pending: () => html` <inch-icon icon="unicornRun"></inch-icon>`,
      complete: (infoList) => html`
        <inch-scroll-view-consumer>
          ${map(infoList, (info) => html` <inch-wallet-view .info="${info}"></inch-wallet-view>`)}
        </inch-scroll-view-consumer>
      `,
    })
  }

  private getController() {
    return this.applicationContext.value.wallet
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inch-wallet-list': WalletListElement
  }
}
