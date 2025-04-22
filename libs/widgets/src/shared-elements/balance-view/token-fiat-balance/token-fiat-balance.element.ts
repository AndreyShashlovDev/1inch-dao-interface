import { lazyAppContextConsumer } from '@1inch-community/core/lazy'
import { subscribe } from '@1inch-community/core/lit-utils'
import { ChainId, IBigFloat, TokenRecordId } from '@1inch-community/models'
import '@1inch-community/ui-components/loaders'
import { Task } from '@lit/task'
import { html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { styleMap } from 'lit/directives/style-map.js'
import { tap } from 'rxjs'
import type { Address } from 'viem'

@customElement(TokenFiatBalanceElement.tagName)
export class TokenFiatBalanceElement extends LitElement {
  static tagName = 'inch-token-fiat-balance' as const

  @property({ type: String, attribute: false }) tokenId?: TokenRecordId
  @property({ type: String, attribute: false }) symbol?: string
  @property({ type: String, attribute: false }) chainIds?: ChainId[]
  @property({ type: String, attribute: false }) walletAddress?: Address
  @property({ type: Boolean, attribute: true }) endTextAlign = false

  private readonly applicationContext = lazyAppContextConsumer(this)

  private readonly task = new Task(
    this,
    async ([tokenId, symbol, chainIds, walletAddress]) => {
      if (tokenId && walletAddress) {
        return await this.applicationContext.value.tokenStorage.getTokenFiatBalanceById(
          tokenId,
          walletAddress
        )
      }
      if (symbol && chainIds && walletAddress) {
        return await this.applicationContext.value.tokenStorage.getTotalTokenFiatBalanceBySymbol(
          chainIds,
          symbol,
          walletAddress
        )
      }
      throw new Error('')
    },
    () => [this.tokenId, this.symbol, this.chainIds, this.walletAddress] as const
  )

  protected firstUpdated() {
    subscribe(
      this,
      [
        this.applicationContext.value.onChain.crossChainEmitter.pipe(
          tap(() => this.task.run([this.tokenId, this.symbol, this.chainIds, this.walletAddress]))
        ),
      ],
      { requestUpdate: false }
    )
  }

  protected render() {
    return this.task.render({
      error: () => this.renderBalanceOrLoader(),
      pending: () => this.renderBalanceOrLoader(),
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
    const style = {
      marginLeft: this.endTextAlign ? 'auto' : '',
    }
    return html`<inch-loader-skeleton style="${styleMap(style)}"></inch-loader-skeleton>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [TokenFiatBalanceElement.tagName]: TokenFiatBalanceElement
  }
}
