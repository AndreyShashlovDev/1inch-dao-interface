import { lazyAppContextConsumer } from '@1inch-community/core/lazy'
import { appendClass } from '@1inch-community/core/lit-utils'
import { IToken, TokenRecordId } from '@1inch-community/models'
import { getChainById } from '@1inch-community/sdk/chain'
import '@1inch-community/ui-components/marquee'
import { Task } from '@lit/task'
import { html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { Address } from 'viem'
import '../../balance-view'
import '../../token-icon'
import { favoriteToken, selectToken } from '../events'
import '../token-item-base'
import { tokenItemBaseHostStyle } from '../token-item-base'
import '../token-item-loader'

@customElement(TokenItemCrossChainFlatElement.tagName)
export class TokenItemCrossChainFlatElement extends LitElement {
  static tagName = 'inch-token-item-cross-chain-flat' as const

  static override styles = tokenItemBaseHostStyle

  @property({ type: String, attribute: false }) tokenId?: TokenRecordId
  @property({ type: String, attribute: false }) walletAddress?: Address
  @property({ type: Boolean, attribute: false }) showFavoriteTokenToggle = false
  @property({ type: Boolean, attribute: false }) mobileView = false
  @property({ type: Number, attribute: false }) index = 0

  @state() private isFavorite = false

  private readonly applicationContext = lazyAppContextConsumer(this)

  private readonly task = new Task(
    this,
    async ([tokenId]) => {
      if (!tokenId) throw new Error('')
      return await this.applicationContext.value.tokenStorage.getTokenById(tokenId)
    },
    () => [this.tokenId, this.walletAddress] as const
  )

  protected render() {
    return this.task.render({
      complete: () => this.renderTokenViewOrLoader(),
      pending: () => this.renderTokenViewOrLoader(),
      error: () => this.renderTokenViewOrLoader(),
    })
  }

  private renderTokenViewOrLoader() {
    return this.renderTokenView(this.task.value)
  }

  private renderTokenView(token?: IToken | null) {
    const chain = token ? getChainById(token.chainId) : null

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
      grid: true,
      'show-favorite-token-toggle': this.showFavoriteTokenToggle,
      'favorite-token': this.isFavorite,
      'mobile-view': this.mobileView,
    })

    return html` <inch-token-item-base
      .tokenChainId="${token?.chainId}"
      .tokenAddress="${token?.address}"
      .tokenNameText="${token?.name}"
      .tokenNetworkText="${chain?.name ? `on ${chain?.name}` : undefined}"
      .symbol="${token?.symbol}"
      .walletAddress="${this.walletAddress}"
      .mobileView="${this.mobileView}"
      .showIconAfter="${this.showFavoriteTokenToggle}"
      .iconAfterName="${'startDefault16'}"
      .iconAfterProps="${favoriteIconStyle}"
      .showIconAfterOnHover="${!this.isFavorite}"
      @onClickIconAfter="${() => {
        if (!this.tokenId) return
        this.isFavorite = !this.isFavorite
        favoriteToken(this, [this.isFavorite, this.tokenId])
      }}"
      @onClickToken="${() => {
        if (!token) return
        selectToken(this, token)
      }}"
    ></inch-token-item-base>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [TokenItemCrossChainFlatElement.tagName]: TokenItemCrossChainFlatElement
  }
}
