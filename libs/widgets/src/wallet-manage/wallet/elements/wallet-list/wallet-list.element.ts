import { lazyAppContextConsumer } from '@1inch-community/core/lazy'
import { translate } from '@1inch-community/core/lit-utils'
import '@1inch-community/ui-components/icon'
import '@1inch-community/ui-components/scroll'
import { Task } from '@lit/task'
import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import { map } from 'lit/directives/map.js'
import '../wallet-view'
import { walletListStyle } from './wallet-list.style'

@customElement(WalletListElement.tagName)
export class WalletListElement extends LitElement {
  static tagName = 'inch-wallet-list' as const

  static override styles = walletListStyle

  private readonly applicationContext = lazyAppContextConsumer(this)

  private readonly task = new Task(
    this,
    async () => await this.getController().getSupportedWallets(),
    () => []
  )

  private getAgreementsView() {
    return html`
      <div class="agreements">
        ${translate('widgets.wallet-list.agreements-main')}
        <span class="agreements-link">${translate('widgets.wallet-list.agreements-terms')}</span>
        ${translate('widgets.wallet-list.agreements-and')}
        <span class="agreements-link">${translate('widgets.wallet-list.agreements-privacy')}</span>
      </div>
    `
  }

  protected override render() {
    return this.task.render({
      pending: () => html` <inch-icon icon="unicornRun"></inch-icon>`,
      complete: (infoList) => html`
        <inch-scroll-view-consumer>
          <div class="container">
            ${map(infoList, (info) => html` <inch-wallet-view .info="${info}"></inch-wallet-view>`)}
            ${this.getAgreementsView()}
          </div>
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
