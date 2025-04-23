import { lazyAppContextConsumer } from '@1inch-community/core/lazy'
import { subscribe } from '@1inch-community/core/lit-utils'
import { IBigFloat } from '@1inch-community/models'
import { Task } from '@lit/task'
import { html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { tap } from 'rxjs'
import { Address } from 'viem'

@customElement(WalletTotalFiatBalanceElement.tagName)
export class WalletTotalFiatBalanceElement extends LitElement {
  static tagName = 'inch-wallet-total-fiat-balance' as const

  @property({ type: String, attribute: false }) address?: Address

  private readonly applicationContext = lazyAppContextConsumer(this)

  private readonly task = new Task(
    this,
    async ([address]) => {
      if (!address) throw new Error('')
      return await this.applicationContext.value.tokenStorage.getCrossChainTotalFiatBalance(address)
    },
    () => [this.address] as const
  )

  protected firstUpdated() {
    subscribe(
      this,
      [
        this.applicationContext.value.onChain.crossChainEmitter.pipe(
          tap(() => this.task.run([this.address]))
        ),
      ],
      { requestUpdate: false }
    )
  }

  protected override render() {
    return this.task.render({
      pending: () => this.renderBalanceOrLoader(),
      error: () => this.renderBalanceOrLoader(),
      complete: () => this.renderBalanceOrLoader(),
    })
  }

  private renderBalanceOrLoader() {
    if (!this.task.value) return this.renderLoader()
    return this.renderBalance(this.task.value)
  }

  private renderBalance(balance: IBigFloat) {
    return html`$${balance.toFixedSmart(2)}`
  }
  private renderLoader() {
    return html`<inch-loader-skeleton></inch-loader-skeleton>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [WalletTotalFiatBalanceElement.tagName]: WalletTotalFiatBalanceElement
  }
}
