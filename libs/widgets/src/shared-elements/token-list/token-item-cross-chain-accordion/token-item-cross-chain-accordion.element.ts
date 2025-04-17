import { lazyAppContextConsumer } from '@1inch-community/core/lazy'
import { appendClass, appendStyle, translate } from '@1inch-community/core/lit-utils'
import {
  ChainId,
  IBigFloat,
  ICrossChainTokensBindingRecord,
  TokenRecordId,
} from '@1inch-community/models'
import '@1inch-community/ui-components/button'
import '@1inch-community/ui-components/icon'
import '@1inch-community/ui-components/text-animate'
import { Task } from '@lit/task'
import { html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { map } from 'lit/directives/map.js'
import { when } from 'lit/directives/when.js'
import { Address } from 'viem'
import '../../token-icon'
import { changeExpand } from '../events'
import './token-item-cross-chain-accordion-chain-view'
import { tokenItemCrossChainAccordionStyle } from './token-item-cross-chain-accordion.style'

@customElement(TokenItemCrossChainAccordionElement.tagName)
export class TokenItemCrossChainAccordionElement extends LitElement {
  static tagName = 'inch-token-item-cross-chain-accordion' as const

  static override styles = tokenItemCrossChainAccordionStyle

  @property({ type: Object, attribute: false })
  crossChainTokensBindingRecord?: ICrossChainTokensBindingRecord

  @property({ type: String, attribute: false }) walletAddress?: Address

  @property({ type: Array, attribute: false }) showChainIds?: ChainId[]

  @property({ type: Boolean, attribute: false }) showFavoriteTokenToggle = false

  @property({ type: Boolean, attribute: false }) expanded = false

  @state() private showMoreChain = false

  private readonly applicationContext = lazyAppContextConsumer(this)

  private readonly task = new Task(
    this,
    async ([crossChainTokensBindingRecord, walletAddress, showChainIds]) => {
      if (!crossChainTokensBindingRecord || !showChainIds) throw new Error('')
      const { symbol } = crossChainTokensBindingRecord
      const [tokenName, tokenBalance, tokenFiatBalance, tokenIdListWithBalance] = await Promise.all(
        [
          this.applicationContext.value.tokenStorage.getCrossChainTokenName(symbol),
          walletAddress
            ? this.applicationContext.value.tokenStorage.getCrossChainTokenBalance(
                symbol,
                walletAddress
              )
            : null,
          walletAddress
            ? this.applicationContext.value.tokenStorage.getCrossChainTokenFiatBalance(
                symbol,
                walletAddress
              )
            : null,
          walletAddress
            ? this.applicationContext.value.tokenStorage.getCrossChainTokenIdListWithBalance(
                showChainIds ?? [],
                symbol,
                walletAddress
              )
            : null,
        ]
      )
      const tokenIdWithBalanceSet = new Set(tokenIdListWithBalance ?? [])
      const tokenIdListWithoutBalance = crossChainTokensBindingRecord.tokenRecordIds.filter(
        (id) => !tokenIdWithBalanceSet.has(id)
      )
      if (tokenIdWithBalanceSet.size === 0) {
        this.showMoreChain = true
      }
      return [
        crossChainTokensBindingRecord,
        tokenName,
        tokenBalance,
        tokenFiatBalance,
        tokenIdListWithoutBalance,
        tokenIdListWithBalance,
      ] as const
    },
    () => [this.crossChainTokensBindingRecord, this.walletAddress, this.showChainIds] as const
  )

  disconnectedCallback() {
    super.disconnectedCallback()
    if (this.expanded) {
      changeExpand(this)
    }
  }

  protected render() {
    return this.task.render({
      pending: () => this.renderTokenViewOrLoader(),
      error: () => this.renderTokenViewOrLoader(),
      complete: () => this.renderTokenViewOrLoader(),
    })
  }

  private renderTokenViewOrLoader() {
    if (!this.task.value) return this.renderLoader()
    const [
      crossChainTokensBindingRecord,
      tokenName,
      tokenBalance,
      tokenFiatBalance,
      tokenIdListWithoutBalance,
      tokenIdListWithBalance,
    ] = this.task.value
    return this.renderTokenView(
      crossChainTokensBindingRecord,
      tokenName,
      tokenBalance,
      tokenFiatBalance,
      tokenIdListWithoutBalance,
      tokenIdListWithBalance
    )
  }

  private renderTokenView(
    crossChainTokensBindingRecord: ICrossChainTokensBindingRecord,
    tokenName: string,
    balance: IBigFloat | null,
    fiatBalance: IBigFloat | null,
    tokenIdListWithoutBalance: TokenRecordId[],
    tokenIdListWithBalance: TokenRecordId[] | null
  ) {
    const { symbol } = crossChainTokensBindingRecord
    let balanceFormat = '0'
    let fiatBalanceFormat = '0'
    if (balance) {
      balanceFormat = balance.toFixedSmart(2)
    }
    if (fiatBalance) {
      fiatBalanceFormat = fiatBalance.toFixedSmart(2)
    }

    const renderItemsCount = this.showMoreChain
      ? tokenIdListWithoutBalance.length + (tokenIdListWithBalance?.length ?? 0)
      : tokenIdListWithBalance?.length || tokenIdListWithoutBalance.length
    this.updateHostStyle(renderItemsCount, (tokenIdListWithBalance?.length ?? 0) >= 1)
    return html`
      <div class="cross-chain-token-container" @click="${() => changeExpand(this)}">
        <div class="left">
          <inch-token-icon symbol="${symbol}" size="40"></inch-token-icon>
          <div>
            <div class="text">${tokenName}</div>
            <div class="description">
              ${this.renderNetworkDescription(crossChainTokensBindingRecord)}
            </div>
          </div>
        </div>
        <div class="right">
          ${when(fiatBalanceFormat, () => html`<div class="text">${balanceFormat} ${symbol}</div>`)}
          ${when(balanceFormat, () => html`<div class="description">$${fiatBalanceFormat}</div>`)}
        </div>
        <inch-icon class="chevron" icon="chevronDown16"></inch-icon>
      </div>
      ${this.renderChainList(tokenIdListWithoutBalance, tokenIdListWithBalance)}
    `
  }

  private renderChainList(
    tokenIdListWithoutBalance: TokenRecordId[],
    tokenIdListWithBalance: TokenRecordId[] | null
  ) {
    return html`
      <div class="chain-list-view">
        ${map(
          tokenIdListWithBalance ?? [],
          (id) => html`
            <inch-token-item-cross-chain-accordion-chain-view
              class="token-with-balance"
              .showFavoriteTokenToggle="${this.showFavoriteTokenToggle}"
              .tokenId="${id}"
              .walletAddress="${this.walletAddress}"
            ></inch-token-item-cross-chain-accordion-chain-view>
          `
        )}
        ${map(
          tokenIdListWithoutBalance,
          (id) => html`
            <inch-token-item-cross-chain-accordion-chain-view
              class="token-without-balance"
              .showFavoriteTokenToggle="${this.showFavoriteTokenToggle}"
              .tokenId="${id}"
              .walletAddress="${this.walletAddress}"
            ></inch-token-item-cross-chain-accordion-chain-view>
          `
        )}
        ${when(
          tokenIdListWithBalance?.length,
          () => html`
            <inch-button
              class="more-chain-button"
              type="link"
              @click="${() => {
                this.showMoreChain = !this.showMoreChain
              }}"
            >
              <span class="less-more-icon-container">
                <inch-icon class="less-more-icon less-icon" icon="minus24"></inch-icon>
                <inch-icon class="less-more-icon more-icon" icon="plus24"></inch-icon>
              </span>
              <inch-text-animate text="${this.showMoreChain ? 'Less' : 'More'}">
              </inch-text-animate>
            </inch-button>
          `
        )}
      </div>
    `
  }

  private renderNetworkDescription(crossChainTokensBindingRecord: ICrossChainTokensBindingRecord) {
    return html`
      <span>
        ${crossChainTokensBindingRecord.tokenRecordIds.length}
        ${when(
          crossChainTokensBindingRecord.tokenRecordIds.length === 1,
          () => html`${translate('inch-token-item-cross-chain-accordion.network')}`,
          () => html`${translate('inch-token-item-cross-chain-accordion.networks')}`
        )}
      </span>
    `
  }

  private renderLoader() {}

  private updateHostStyle(listLength: number, showMore: boolean) {
    appendClass(this, {
      expanded: this.expanded,
      'show-more-chain': this.showMoreChain,
    })
    const paddingTop = 8
    const marginBottom = 8
    const hostBaseSize = 72
    const chainItemSize = 60
    const openMoreItemSize = 24
    const openMoreItemPaddingTop = 8
    let total = listLength * chainItemSize + hostBaseSize + paddingTop + marginBottom
    if (showMore) {
      total += openMoreItemSize + openMoreItemPaddingTop
    }

    if (this.expanded) {
      appendStyle(this, {
        height: `${total}px`,
      })
    } else {
      appendStyle(this, {
        height: '',
      })
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [TokenItemCrossChainAccordionElement.tagName]: TokenItemCrossChainAccordionElement
  }
}
