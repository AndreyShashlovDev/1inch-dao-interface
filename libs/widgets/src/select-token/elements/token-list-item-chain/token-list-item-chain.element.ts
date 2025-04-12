import { lazyAppContextConsumer } from '@1inch-community/core/lazy'
import { IBigFloat, IToken, TokenRecordId } from '@1inch-community/models'
import { chainViewConfig } from '@1inch-community/sdk/chain'
import '@1inch-community/ui-components/icon'
import { Task } from '@lit/task'
import { html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { tokenListItemChainStyle } from './token-list-item-chain.style'

@customElement(TokenListItemChainElement.tagName)
export class TokenListItemChainElement extends LitElement {
  static readonly tagName = 'inch-token-list-item-chain' as const

  static readonly styles = tokenListItemChainStyle

  @property({ type: String, attribute: true }) tokenRecordId?: TokenRecordId

  private readonly applicationContext = lazyAppContextConsumer(this)

  private readonly task = new Task(
    this,
    async ([tokenRecordId]) => {
      if (!tokenRecordId) throw new Error('')
      const [token, balance, fiatBalance] = await Promise.all([
        this.applicationContext.value.tokenStorage.getTokenById(tokenRecordId),
        this.applicationContext.value.tokenStorage.getTokenBalanceById(tokenRecordId),
        this.applicationContext.value.tokenStorage.getTokenFiatBalanceById(tokenRecordId),
      ])
      if (!token) {
        console.error('token not found', tokenRecordId)
        throw new Error('')
      }
      return [token, balance, fiatBalance] as const
    },
    () => [this.tokenRecordId]
  )

  protected render() {
    return this.task.render({
      error: () => this.preRender(),
      pending: () => this.preRender(),
      complete: ([token, balance, fiatBalance]) => this.chainView(token, balance, fiatBalance),
    })
  }

  private loaderView() {
    return html``
  }

  private preRender() {
    if (!this.task.value) return this.loaderView()
    const [token, balance, fiatBalance] = this.task.value
    return this.chainView(token, balance, fiatBalance)
  }

  private chainView(token: IToken, balance: IBigFloat, fiatBalance: IBigFloat) {
    const chainView = chainViewConfig[token.chainId]
    if (!chainView) return this.loaderView()
    const balanceView = balance.toFixedSmart(2)
    const fiatBalanceView = fiatBalance.toFixedSmart(2)
    return html`
      <div class="left">
        <inch-icon icon="cornerDownRight16"></inch-icon>
        <inch-icon icon="${chainView.iconName}"></inch-icon>
        <div>${chainView.name}</div>
      </div>
      <div class="right">
        <div class="balance">${balanceView} ${token.symbol}</div>
        <div class="fiat-balance">$${fiatBalanceView}</div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [TokenListItemChainElement.tagName]: TokenListItemChainElement
  }
}
