import { lazyAppContextConsumer } from '@1inch-community/core/lazy'
import { appendClass, subscribe } from '@1inch-community/core/lit-utils'
import { IBigFloat, IToken, TokenRecordId } from '@1inch-community/models'
import { getChainById } from '@1inch-community/sdk/chain'
import { Task } from '@lit/task'
import { html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'
import { fromEvent, tap } from 'rxjs'
import { Address } from 'viem'
import '../../token-icon'
import { favoriteToken, selectToken } from '../events'
import { favoriteTokenToggleStyle } from '../styles/favorite-token-toggle.style'
import { tokenItemCrossChainFlatStyle } from './token-item-cross-chain-flat.style'

@customElement(TokenItemCrossChainFlatElement.tagName)
export class TokenItemCrossChainFlatElement extends LitElement {
  static tagName = 'inch-token-item-cross-chain-flat' as const

  static override styles = [tokenItemCrossChainFlatStyle, favoriteTokenToggleStyle]

  @property({ type: String, attribute: false }) tokenId?: TokenRecordId
  @property({ type: String, attribute: false }) walletAddress?: Address
  @property({ type: Boolean, attribute: false }) showFavoriteTokenToggle = false

  @state() private isFavorite = false

  private readonly applicationContext = lazyAppContextConsumer(this)

  private readonly task = new Task(
    this,
    async ([tokenId, walletAddress]) => {
      if (!tokenId) throw new Error('')
      return await Promise.all([
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

  protected render() {
    return this.task.render({
      complete: () => this.renderTokenViewOrLoader(),
      pending: () => this.renderTokenViewOrLoader(),
      error: () => this.renderTokenViewOrLoader(),
    })
  }

  private renderTokenViewOrLoader() {
    if (!this.task.value) return this.renderLoader()
    const [token, balance, fiatBalance] = this.task.value
    return this.renderTokenView(token, balance, fiatBalance)
  }

  private renderTokenView(
    token: IToken | null,
    balance: IBigFloat | null,
    fiatBalance: IBigFloat | null
  ) {
    if (token === null) {
      return this.renderLoader()
    }
    let balanceFormat = '0'
    let fiatBalanceFormat = '0'
    if (balance) {
      balanceFormat = balance.toFixedSmart(2)
    }
    if (fiatBalance) {
      fiatBalanceFormat = fiatBalance.toFixedSmart(2)
    }
    const chain = getChainById(token.chainId)

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
        <inch-token-icon
          symbol="${token.symbol}"
          chainId="${token.chainId}"
          address="${token.address}"
          size="40"
        ></inch-token-icon>
        <div>
          <div class="text">${token.name}</div>
          <div class="description">on ${chain.name}</div>
        </div>
      </div>
      <div class="right">
        ${when(fiatBalanceFormat, () => html`<div class="text">$${fiatBalanceFormat}</div>`)}
        ${when(
          balanceFormat,
          () => html`<div class="description">${balanceFormat} ${token.symbol}</div>`
        )}
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
    [TokenItemCrossChainFlatElement.tagName]: TokenItemCrossChainFlatElement
  }
}
