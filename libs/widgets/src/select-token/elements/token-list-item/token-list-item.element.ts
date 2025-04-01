import { ApplicationContextToken } from '@1inch-community/core/application-context'
import { subscribe, translate } from '@1inch-community/core/lit-utils'
import { BigFloat } from '@1inch-community/core/math'
import {
  IApplicationContext,
  IBigFloat,
  ICrossChainTokensBindingRecord,
  ISelectTokenContext,
  TokenRecordId,
} from '@1inch-community/models'
import '@1inch-community/ui-components/icon'
import '@1inch-community/widgets/token-icon'
import { consume } from '@lit/context'
import { Task } from '@lit/task'
import { html, LitElement, TemplateResult } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { map as litMap } from 'lit/directives/map.js'
import { when } from 'lit/directives/when.js'
import { merge, switchMap } from 'rxjs'
import { Address } from 'viem'
import { selectTokenContext } from '../../context'
import '../token-list-stub-item'
import { tokenListItemStyle } from './token-list-item.style'

@customElement(TokenListItemElement.tagName)
export class TokenListItemElement extends LitElement {
  static tagName = 'inch-token-list-item' as const

  static override styles = tokenListItemStyle

  @property({ type: Object, attribute: false })
  crossChainTokensBindingRecord?: ICrossChainTokensBindingRecord

  @property({ type: String, attribute: false }) walletAddress?: Address

  @consume({ context: selectTokenContext })
  context?: ISelectTokenContext

  @consume({ context: ApplicationContextToken })
  applicationContext!: IApplicationContext

  @state()
  expanded = false

  private isDestroy = false

  private preRenderTemplate: TemplateResult | null = null

  private task = new Task(
    this,
    async ([crossChainTokensBindingRecord, walletAddress, fastUpdate]) => {
      if (fastUpdate) {
        const result = this.task.value as unknown
        if (result)
          return result as [
            ICrossChainTokensBindingRecord,
            string,
            IBigFloat,
            IBigFloat,
            TokenRecordId[],
          ]
      }
      if (!crossChainTokensBindingRecord) throw new Error('')
      if (this.isDestroy) throw new Error('')
      const { symbol } = crossChainTokensBindingRecord
      const [tokenName, tokenBalance, tokenFiatBalance, tokenIdListWithBalance] = await Promise.all(
        [
          this.applicationContext.tokenStorage.getCrossChainTokenName(symbol),
          walletAddress
            ? this.applicationContext.tokenStorage.getCrossChainTokenBalance(symbol, walletAddress)
            : Promise.resolve(BigFloat.zero()),
          walletAddress
            ? this.applicationContext.tokenStorage.getCrossChainTokenFiatBalance(
                symbol,
                walletAddress
              )
            : Promise.resolve(BigFloat.zero()),
          walletAddress
            ? this.applicationContext.tokenStorage.getCrossChainTokenIdListWithBalance(
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
    () => [this.crossChainTokensBindingRecord, this.walletAddress, false as boolean] as const
  )

  override disconnectedCallback() {
    super.disconnectedCallback()
    this.isDestroy = true
  }

  protected override firstUpdated() {
    if (this.context && this.crossChainTokensBindingRecord) {
      this.expanded = this.context?.isOpenCrossChainView(this.crossChainTokensBindingRecord?.symbol)
    }
    subscribe(
      this,
      merge(this.applicationContext.onChain.crossChainEmitter).pipe(
        switchMap(() =>
          this.task.run([this.crossChainTokensBindingRecord, this.walletAddress, false])
        )
      ),
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
          if (this.preRenderTemplate) return this.preRenderTemplate
          return this.getStub()
        },
        error: () => {
          if (this.preRenderTemplate) return this.preRenderTemplate
          return this.getStub()
        },
      })}
    `
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

    this.preRenderTemplate = html`
      <div>
        <div
          class="${classMap(classes)}"
          @click="${() => {
            this.expanded = !this.expanded
            this.context?.onOpenCrossChainView(symbol, this.expanded)
          }}"
        >
          <inch-token-icon symbol="${symbol}" size="40"></inch-token-icon>
          <div class="content">
            <span class="primary-content">${tokenName}</span>
            <span class="secondary-content"
              >${tokenRecordIds.length}
              ${when(
                tokenRecordIds.length === 1,
                () => html`${translate('inch-token-list-item.network')}`,
                () => html`${translate('inch-token-list-item.networks')}`
              )}</span
            >
          </div>

          <div class="right-content content">
            <span class="primary-content">${balanceFormat} ${symbol}</span>
            <span class="secondary-content">${balanceUsdFormat}</span>
          </div>
        </div>
        ${when(
          this.expanded,
          () => html` <div>${litMap(tokenRecordIds, (id) => html` <div>${id}</div> `)}</div> `
        )}
      </div>
    `

    return this.preRenderTemplate
  }

  private getStub() {
    return html` <inch-token-list-stub-item></inch-token-list-stub-item> `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inch-token-list-item': TokenListItemElement
  }
}
