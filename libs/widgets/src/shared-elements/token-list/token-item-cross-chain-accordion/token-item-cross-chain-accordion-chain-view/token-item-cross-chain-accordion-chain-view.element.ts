import { lazyAppContextConsumer } from '@1inch-community/core/lazy'
import { appendClass, subscribe } from '@1inch-community/core/lit-utils'
import { IBigFloat, IToken, TokenRecordId } from '@1inch-community/models'
import { chainViewConfig } from '@1inch-community/sdk/chain'
import { Task } from '@lit/task'
import { html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'
import { fromEvent, tap } from 'rxjs'
import { Address } from 'viem'
import '../../../token-icon'
import { favoriteToken, selectToken } from '../../events'
import { favoriteTokenToggleStyle } from '../../styles/favorite-token-toggle.style'
import { tokenItemCrossChainAccordionChainViewStyle } from './token-item-cross-chain-accordion-chain-view.style'

@customElement(TokenItemCrossChainAccordionChainViewElement.tagName)
export class TokenItemCrossChainAccordionChainViewElement extends LitElement {
  static tagName = 'inch-token-item-cross-chain-accordion-chain-view' as const

  static override styles = [tokenItemCrossChainAccordionChainViewStyle, favoriteTokenToggleStyle]

  @property({ type: String, attribute: false }) tokenId?: TokenRecordId
  @property({ type: String, attribute: false }) walletAddress?: Address
  @property({ type: Boolean, attribute: false }) showFavoriteTokenToggle = false

  @state() private isFavorite = false

  private readonly applicationContext = lazyAppContextConsumer(this)

  private readonly task = new Task(
    this,
    async ([tokenId, walletAddress]) => {
      if (!tokenId) throw new Error('')
      const [token, balance, fiatBalance] = await Promise.all([
        this.applicationContext.value.tokenStorage.getTokenById(tokenId),
        walletAddress
          ? this.applicationContext.value.tokenStorage.getTokenBalanceById(tokenId, walletAddress)
          : null,
        walletAddress
          ? this.applicationContext.value.tokenStorage.getTokenFiatBalanceById(
              tokenId,
              walletAddress
            )
          : null,
      ])
      if (!token) {
        console.error('token not found', tokenId)
        throw new Error('')
      }
      return [token, balance, fiatBalance] as const
    },
    () => [this.tokenId, this.walletAddress] as const
  )

  protected override firstUpdated() {
    subscribe(
      this,
      [
        fromEvent(this, 'click').pipe(
          tap(() => {
            if (!this.task.value || !this.task.value[0]) return
            const token = this.task.value[0]
            selectToken(this, token)
          })
        ),
      ],
      { requestUpdate: false }
    )
  }

  render() {
    return this.task.render({
      error: () => this.renderChainViewOrLoader(),
      pending: () => this.renderChainViewOrLoader(),
      complete: () => this.renderChainViewOrLoader(),
    })
  }

  private renderChainViewOrLoader() {
    if (!this.task.value) return this.renderLoader()
    const [token, balance, fiatBalance] = this.task.value
    return this.renderChainView(token, balance, fiatBalance)
  }

  private renderChainView(token: IToken, balance: IBigFloat | null, fiatBalance: IBigFloat | null) {
    const chainView = chainViewConfig[token.chainId]
    if (!chainView) return this.renderLoader()
    let balanceFormat = '0'
    let fiatBalanceFormat = '0'
    if (balance) {
      balanceFormat = balance.toFixedSmart(2)
    }
    if (fiatBalance) {
      fiatBalanceFormat = fiatBalance.toFixedSmart(2)
    }
    let favoriteIconStyle: Record<string, string> = {
      border: 'var(--color-content-content-secondary)',
    }
    if (this.isFavorite) {
      favoriteIconStyle = {
        border: 'var(--color-core-orange-warning)',
        body: 'var(--color-core-orange-warning)',
      }
    }
    appendClass(this, {
      'show-favorite-token-toggle': this.showFavoriteTokenToggle,
      'favorite-token': this.isFavorite,
    })
    return html`
      <div class="left">
        <inch-icon class="corner-icon" icon="cornerDownRight16"></inch-icon>
        <inch-icon icon="${chainView.iconName}"></inch-icon>
        <div>${chainView.name}</div>
      </div>
      <div class="right">
        <div class="balance">${balanceFormat} ${token.symbol}</div>
        <div class="fiat-balance">$${fiatBalanceFormat}</div>
      </div>
      ${when(
        this.showFavoriteTokenToggle,
        () => html`
          <inch-icon
            class="favorite-icon"
            icon="startDefault16"
            .props="${favoriteIconStyle}"
            @click="${(event: UIEvent) => {
              event.stopPropagation()
              event.preventDefault()
              if (!this.tokenId) return
              this.isFavorite = !this.isFavorite
              favoriteToken(this, [this.isFavorite, this.tokenId])
            }}"
          ></inch-icon>
        `
      )}
    `
  }

  private renderLoader() {
    return html``
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [TokenItemCrossChainAccordionChainViewElement.tagName]: TokenItemCrossChainAccordionChainViewElement
  }
}
