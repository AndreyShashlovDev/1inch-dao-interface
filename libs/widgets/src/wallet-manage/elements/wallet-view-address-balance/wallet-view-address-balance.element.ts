import { ApplicationContextToken } from '@1inch-community/core/application-context'
import { LongTimeCache } from '@1inch-community/core/cache'
import { IApplicationContext } from '@1inch-community/models'
import { consume } from '@lit/context'
import { Task } from '@lit/task'
import { html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { Address } from 'viem'
import { walletViewAddressBalanceStyle } from './wallet-view-address-balance.style'

const storage = new LongTimeCache<string, string>('inch-wallet-view-address-balance', 7)

@customElement(WalletViewAddressBalanceElement.tagName)
export class WalletViewAddressBalanceElement extends LitElement {
  static tagName = 'inch-wallet-view-address-balance' as const

  static override styles = walletViewAddressBalanceStyle

  @property({ type: String }) address?: Address

  @consume({ context: ApplicationContextToken })
  applicationContext!: IApplicationContext

  private readonly task = new Task(
    this,
    async ([address]) => {
      if (!address) throw new Error('')
      const fiatBalance =
        await this.applicationContext.tokenStorage.getCrossChainTotalFiatBalance(address)
      const balance = fiatBalance.toFixedSmart(2)
      storage.set(address, balance)
      return balance
    },
    () => [this.address] as const
  )

  protected override render() {
    return this.task.render({
      pending: () => this.getLoader(),
      error: () => this.getLoader(),
      complete: (balance) => {
        return html`<span>$${balance}</span>`
      },
    })
  }

  private getLoader() {
    const loader = () => html`<div class="loader"></div>`
    if (!this.address) return loader()
    const balance = storage.get(this.address)
    if (balance) {
      return html`<span>$${balance}</span>`
    }
    return loader()
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inch-wallet-view-address-balance': WalletViewAddressBalanceElement
  }
}
