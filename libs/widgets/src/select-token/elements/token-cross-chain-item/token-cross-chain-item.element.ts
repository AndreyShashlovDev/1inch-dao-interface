import { lazyAppContextConsumer } from '@1inch-community/core/lazy'
import {
  appendClass,
  appendStyle,
  dispatchEvent,
  subscribe,
  translate,
} from '@1inch-community/core/lit-utils'
import { BigFloat } from '@1inch-community/core/math'
import {
  ChainId,
  IBigFloat,
  ICrossChainTokensBindingRecord,
  ISelectTokenContext,
  TokenRecordId,
} from '@1inch-community/models'
import '@1inch-community/ui-components/icon'
import '@1inch-community/widgets/token-icon'
import { consume } from '@lit/context'
import { Task } from '@lit/task'
import { html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { map as litMap } from 'lit/directives/map.js'
import { when } from 'lit/directives/when.js'
import { merge, switchMap, tap } from 'rxjs'
import { Address } from 'viem'
import { selectTokenContext } from '../../context'
import '../token-list-item-chain'
import '../token-list-stub-item'
import { tokenCrossChainItemStyle } from './token-cross-chain-item.style'

@customElement(TokenCrossChainItemElement.tagName)
export class TokenCrossChainItemElement extends LitElement {
  static tagName = 'inch-token-cross-chain-item' as const

  static override styles = tokenCrossChainItemStyle

  @property({ type: Object, attribute: false })
  crossChainTokensBindingRecord?: ICrossChainTokensBindingRecord

  @property({ type: String, attribute: false }) walletAddress?: Address

  @property({ type: Array, attribute: false }) showChainIds?: ChainId[]

  @consume({ context: selectTokenContext })
  context?: ISelectTokenContext

  private readonly applicationContext = lazyAppContextConsumer(this)

  @state()
  expanded = false

  @state()
  expandedMore = false

  private isDestroy = false

  private task = new Task(
    this,
    async ([crossChainTokensBindingRecord, walletAddress, showChainIds]) => {
      if (!crossChainTokensBindingRecord) throw new Error('')
      if (this.isDestroy) throw new Error('')
      const { symbol } = crossChainTokensBindingRecord
      const [tokenName, tokenBalance, tokenFiatBalance, tokenIdListWithBalance] = await Promise.all(
        [
          this.applicationContext.value.tokenStorage.getCrossChainTokenName(symbol),
          walletAddress
            ? this.applicationContext.value.tokenStorage.getCrossChainTokenBalance(
                symbol,
                walletAddress
              )
            : Promise.resolve(BigFloat.zero()),
          walletAddress
            ? this.applicationContext.value.tokenStorage.getCrossChainTokenFiatBalance(
                symbol,
                walletAddress
              )
            : Promise.resolve(BigFloat.zero()),
          walletAddress
            ? this.applicationContext.value.tokenStorage.getCrossChainTokenIdListWithBalance(
                showChainIds ?? [],
                symbol,
                walletAddress
              )
            : Promise.resolve([]),
        ]
      )
      return [
        crossChainTokensBindingRecord,
        tokenName,
        tokenBalance,
        tokenFiatBalance,
        tokenIdListWithBalance,
      ] as const
    },
    () => [this.crossChainTokensBindingRecord, this.walletAddress, this.showChainIds] as const
  )

  override disconnectedCallback() {
    super.disconnectedCallback()
    this.isDestroy = true
  }

  protected override firstUpdated() {
    if (!this.context) {
      throw new Error('Context not init')
    }
    subscribe(
      this,
      [
        merge(this.applicationContext.value.onChain.crossChainEmitter).pipe(
          switchMap(() =>
            this.task.run([
              this.crossChainTokensBindingRecord,
              this.walletAddress,
              this.showChainIds,
            ])
          )
        ),
        this.context.openCrossChainView$.pipe(
          tap(([symbol, more]) => {
            this.expanded = this.crossChainTokensBindingRecord?.symbol === symbol
            this.expandedMore = this.expanded ? more : false
          })
        ),
      ],
      { requestUpdate: false }
    )
  }

  protected override render() {
    return html`
      ${this.task.render({
        complete: ([
          crossChainTokensBindingRecord,
          tokenName,
          balance,
          fiatBalance,
          tokenIdListWithBalance,
        ]) =>
          this.getTokenView(
            crossChainTokensBindingRecord,
            balance,
            fiatBalance,
            tokenIdListWithBalance,
            tokenName
          ),
        pending: () => {
          return this.preRender()
        },
        error: () => {
          return this.preRender()
        },
      })}
    `
  }

  private preRender() {
    if (!this.task.value) {
      return this.getStub()
    }
    const [crossChainTokensBindingRecord, tokenName, balance, fiatBalance, tokenIdListWithBalance] =
      this.task.value
    return this.getTokenView(
      crossChainTokensBindingRecord,
      balance,
      fiatBalance,
      tokenIdListWithBalance,
      tokenName
    )
  }

  private getTokenView(
    crossChainTokensBindingRecord: ICrossChainTokensBindingRecord,
    balance: IBigFloat,
    fiatBalance: IBigFloat,
    tokenIdListWithBalance: TokenRecordId[],
    tokenName: string
  ) {
    if (!crossChainTokensBindingRecord) {
      return this.getStub()
    }

    const { symbol, tokenRecordIds } = crossChainTokensBindingRecord
    const balanceFormat = balance.toFixedSmart(2)
    const balanceUsdFormat = '$' + fiatBalance.toFixedSmart(2)
    const classes = {
      'item-container': true,
      'item-container__expanded': this.expanded,
    }
    const rightContentClasses = {
      content: true,
      'right-content': true,
      'right-content__expanded': this.expanded,
    }
    const moreIconPlusClasses = {
      'more-icon': true,
      'more-icon__hide': this.expandedMore,
    }
    const moreIconMinusClasses = {
      'more-icon': true,
      'more-icon__hide': !this.expandedMore,
    }
    const chainViewClasses = {
      'chain-view': true,
      'chain-view__hide': !this.expanded,
    }

    let tokenIdsList = tokenIdListWithBalance
    if (this.expandedMore) {
      tokenIdsList = [
        ...tokenIdListWithBalance,
        ...tokenRecordIds.filter((id) => !tokenIdListWithBalance.includes(id)),
      ]
    }

    this.updateHostStyle(tokenIdsList.length, tokenIdListWithBalance.length >= 1)
    if (crossChainTokensBindingRecord.symbol === 'USDC') {
      debugger
    }
    return html`
      <div
        class="${classMap(classes)}"
        @click="${async () => {
          this.expandedMore = !tokenIdListWithBalance.length
          dispatchEvent(this, 'selectItem', [symbol, this.expandedMore])
        }}"
      >
        <inch-token-icon symbol="${symbol}" size="40"></inch-token-icon>
        <div class="content">
          <span class="primary-content">${tokenName}</span>
          <span class="secondary-content"
            >${tokenRecordIds.length}
            ${when(
              tokenRecordIds.length === 1,
              () => html`${translate('inch-token-cross-chain-item.network')}`,
              () => html`${translate('inch-token-cross-chain-item.networks')}`
            )}</span
          >
        </div>

        <div class="${classMap(rightContentClasses)}">
          <span class="primary-content">${balanceFormat} ${symbol}</span>
          <span class="secondary-content">${balanceUsdFormat}</span>
        </div>
      </div>

      <div class="${classMap(chainViewClasses)}">
        ${litMap(
          tokenIdsList,
          (id) =>
            html`<inch-token-list-item-chain tokenRecordId="${id}"></inch-token-list-item-chain>`
        )}
        ${when(
          tokenIdListWithBalance.length,
          () => html`
            <div
              class="full-chain-view-button"
              @click="${() => {
                this.context?.onOpenCrossChainView(symbol, !this.expandedMore)
              }}"
            >
              <span class="more-icon-container">
                <inch-icon class="${classMap(moreIconMinusClasses)}" icon="minus24"></inch-icon>
                <inch-icon class="${classMap(moreIconPlusClasses)}" icon="plus24"></inch-icon>
              </span>
              ${when(
                this.expandedMore,
                () => html`<span>Less</span>`,
                () => html`<span>More</span>`
              )}
            </div>
          `
        )}
      </div>
    `
  }

  private updateHostStyle(listLength: number, showMore: boolean) {
    appendClass(this, {
      expanded: this.expanded,
    })
    const paddingTop = 8
    const hostBaseSize = 72
    const chainItemSize = 60
    const openMoreItemSize = 48
    let total = listLength * chainItemSize + hostBaseSize + paddingTop
    if (showMore) {
      total += openMoreItemSize
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

  private getStub() {
    return html` <inch-token-list-stub-item></inch-token-list-stub-item> `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [TokenCrossChainItemElement.tagName]: TokenCrossChainItemElement
  }
}
