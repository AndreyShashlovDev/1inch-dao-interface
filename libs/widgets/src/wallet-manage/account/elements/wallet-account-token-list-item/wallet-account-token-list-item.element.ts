import { formatNumber } from '@1inch-community/core/formatters'
import { lazyAppContextConsumer } from '@1inch-community/core/lazy'
import { dispatchEvent } from '@1inch-community/core/lit-utils'
import {
  ChainId,
  IBalancesTokenRecord,
  IToken,
  IWalletAccountContext,
} from '@1inch-community/models'
import '@1inch-community/ui-components/icon'
import '@1inch-community/widgets/token-icon'
import { consume } from '@lit/context'
import { Task } from '@lit/task'
import { html, LitElement, TemplateResult } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { Address, formatUnits } from 'viem'
import { walletAccountContext } from '../../context'
import '../wallet-account-token-list-stub-item'
import { walletAccountTokenListItemStyle } from './wallet-account-token-list-item.style'

@customElement(WalletAccountTokenListItemElement.tagName)
export class WalletAccountTokenListItemElement extends LitElement {
  static tagName = 'inch-wallet-account-token-list-item' as const

  static override styles = walletAccountTokenListItemStyle

  @property({ type: String, attribute: true }) tokenAddress?: Address

  @property({ type: String, attribute: true }) walletAddress?: Address

  @property({ type: Number, attribute: true }) chainId?: ChainId

  @consume({ context: walletAccountContext })
  context?: IWalletAccountContext

  private readonly applicationContext = lazyAppContextConsumer(this)

  private isDestroy = false

  private preRenderTemplate: TemplateResult | null = null

  private isFavorite = false

  private task = new Task(
    this,
    async ([chainId, tokenAddress, walletAddress, fastUpdate]) => {
      if (fastUpdate) {
        const result = this.task.value as unknown
        if (result) {
          return result as [IToken, IBalancesTokenRecord | null, number | null, boolean]
        }
      }
      if (!chainId || !tokenAddress) {
        return []
      }
      if (this.isDestroy) {
        throw new Error('')
      }
      const token = await this.applicationContext.value.tokenStorage.getToken(chainId, tokenAddress)
      let balance = null
      let balanceUsd = null
      if (walletAddress && token) {
        balance = await this.applicationContext.value.tokenStorage.getTokenBalance(
          chainId,
          tokenAddress,
          walletAddress
        )
        const tokenPrice = await this.applicationContext.value.tokenStorage.getTokenUSDPrice(
          chainId,
          tokenAddress
        )
        const balanceFormatted = formatUnits(BigInt(balance?.amount ?? 0), token.decimals)
        balanceUsd = Number(balanceFormatted) * Number(tokenPrice)
      }
      const isFavoriteToken = token
        ? await this.applicationContext.value.tokenStorage.isFavoriteToken(chainId, token.address)
        : false
      return [token, balance, balanceUsd, isFavoriteToken] as const
    },
    () => [this.chainId, this.tokenAddress, this.walletAddress, false as boolean] as const
  )

  override disconnectedCallback() {
    super.disconnectedCallback()
    this.isDestroy = true
  }

  protected override render() {
    return html`
      ${this.task.render({
        complete: ([token, balance, balanceUsd]) => this.getTokenView(token, balance, balanceUsd),
        pending: () => {
          if (this.preRenderTemplate) {
            return this.preRenderTemplate
          }
          return this.getStub()
        },
        error: () => {
          if (this.preRenderTemplate) {
            return this.preRenderTemplate
          }
          return this.getStub()
        },
      })}
    `
  }

  private getTokenView(
    token: IToken | null,
    balance: IBalancesTokenRecord | null,
    balanceUsd: number | null
  ) {
    if (!token) {
      return this.getStub()
    }

    let balanceFormat = '0'
    if (balance) {
      balanceFormat = formatNumber(formatUnits(BigInt(balance.amount), token.decimals), 6)
    }
    let balanceUsdFormat = '$0'
    if (balanceUsd) {
      balanceUsdFormat = '$' + formatNumber(balanceUsd.toString(), 2)
    }
    let startColor = { border: 'var(--color-border-border-secondary)', body: 'none' }
    if (this.isFavorite) {
      startColor = {
        border: 'var(--color-core-orange-warning)',
        body: 'var(--color-core-orange-warning)',
      }
    }

    const classes = {
      'item-container': true,
      'is-favorite-token': this.isFavorite,
    }

    this.preRenderTemplate = html`
      <div
          class="${classMap(classes)}"
          @click="${() => {
            dispatchEvent(this, 'backCard', null)
          }}"
      >
        <inch-token-icon
            symbol="${token.symbol}"
            address="${token.address}"
            chainId="${token.chainId}"
            size="40"
        ></inch-token-icon>
        <div class="name-and-balance">
          <span class="name">${token.name}</span>
          <span class="balance">${balanceFormat} ${token.symbol}</span>
        </div>

          <div class="right-content content">
<!--            <span class="primary-content">${balanceFormat} symbol</span>-->
            <span class="secondary-content">${balanceUsdFormat}</span>
          </div>
        </div>
      </div>
    `

    return this.preRenderTemplate
  }

  private getStub() {
    return html`
      <inch-wallet-account-token-list-stub-item></inch-wallet-account-token-list-stub-item>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inch-wallet-account-token-list-item': WalletAccountTokenListItemElement
  }
}
