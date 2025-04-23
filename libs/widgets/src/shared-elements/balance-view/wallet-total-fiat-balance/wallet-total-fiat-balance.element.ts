import { lazyAppContextConsumer } from '@1inch-community/core/lazy'
import { subscribe } from '@1inch-community/core/lit-utils'
import { ChainId, IBigFloat } from '@1inch-community/models'
import { getChainIdList } from '@1inch-community/sdk/chain'
import { Task } from '@lit/task'
import { html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { tap } from 'rxjs'
import { Address } from 'viem'

const allChainIds = getChainIdList()

@customElement(WalletTotalFiatBalanceElement.tagName)
export class WalletTotalFiatBalanceElement extends LitElement {
  static tagName = 'inch-wallet-total-fiat-balance' as const

  @property({ type: String, attribute: false }) address?: Address
  @property({ type: String, attribute: false }) chainIds?: ChainId[]
  @property({ type: Boolean, attribute: true }) alwaysBright = false

  private readonly applicationContext = lazyAppContextConsumer(this)

  private readonly task = new Task(
    this,
    async ([address, chainIds]) => {
      if (!address) throw new Error('')
      return await this.applicationContext.value.tokenStorage.getCrossChainTotalFiatBalance({
        walletAddress: address,
        chainIds: chainIds || null,
      })
    },
    () => [this.address, this.chainIds] as const
  )

  protected firstUpdated() {
    subscribe(
      this,
      [
        this.applicationContext.value.onChain.crossChainEmitter.pipe(
          tap(() => this.task.run([this.address, this.chainIds]))
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
