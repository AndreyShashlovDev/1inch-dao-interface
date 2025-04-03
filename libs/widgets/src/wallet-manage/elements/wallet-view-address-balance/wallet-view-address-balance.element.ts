import { ApplicationContextToken } from '@1inch-community/core/application-context'
import { subscribe } from '@1inch-community/core/lit-utils'
import { IApplicationContext } from '@1inch-community/models'
import { consume } from '@lit/context'
import { Task } from '@lit/task'
import { html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { tap } from 'rxjs'
import { Address } from 'viem'
import { walletViewAddressBalanceStyle } from './wallet-view-address-balance.style'

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
      return fiatBalance.toFixedSmart(2)
    },
    () => [this.address] as const
  )

  protected firstUpdated() {
    subscribe(
      this,
      [
        this.applicationContext.onChain.crossChainEmitter.pipe(
          tap(() => {
            this.task.run([this.address])
          })
        ),
      ],
      { requestUpdate: false }
    )
  }

  protected override render() {
    return this.task.render({
      pending: () => this.getLoaderOrBalance(),
      error: () => this.getLoaderOrBalance(),
      complete: () => this.getLoaderOrBalance(),
    })
  }

  private getLoaderOrBalance() {
    const loader = () => html`<div class="loader"></div>`
    if (!this.task.value) return loader()
    const balance = this.task.value
    return html`<span>$${balance}</span>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inch-wallet-view-address-balance': WalletViewAddressBalanceElement
  }
}
