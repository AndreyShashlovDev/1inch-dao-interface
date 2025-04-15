import { formatNumber } from '@1inch-community/core/formatters'
import { lazyAppContextConsumer } from '@1inch-community/core/lazy'
import { observe, translate } from '@1inch-community/core/lit-utils'
import { ISwapContext } from '@1inch-community/models'
import { SwapContextToken } from '@1inch-community/sdk/swap'
import { consume } from '@lit/context'
import { html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { combineLatest, defer, filter, startWith, switchMap } from 'rxjs'
import { formatUnits } from 'viem'
import { balanceStyles } from './balance.styles'

@customElement(BalanceElement.tagName)
export class BalanceElement extends LitElement {
  static tagName = 'inch-swap-balance'

  static override styles = balanceStyles

  @property({ type: String, attribute: true }) tokenType?: 'source' | 'destination'

  @consume({ context: SwapContextToken })
  context?: ISwapContext

  private readonly applicationContext = lazyAppContextConsumer(this)

  readonly balance$ = defer(() => {
    if (!this.context) throw new Error('')
    if (!this.tokenType) throw new Error('')
    return combineLatest([
      this.context.connectedWalletAddress$,
      this.context.getTokenByType(this.tokenType),
      this.context.chainId$,
      this.context.chainId$.pipe(
        switchMap((chainId) =>
          chainId ? this.applicationContext.value.onChain.getBlockEmitter(chainId) : []
        ),
        startWith(null)
      ),
    ])
  }).pipe(
    filter(([address]) => !!address),
    switchMap(async ([walletAddress, token, chainId]) => {
      if (!walletAddress || !token || !chainId) return html`<br />`
      const balanceRecord = await this.applicationContext.value.tokenStorage.getTokenBalance(
        chainId,
        token.address,
        walletAddress
      )
      if (!balanceRecord) return html`<br />`
      const balance = formatNumber(formatUnits(BigInt(balanceRecord.amount), token.decimals), 6)
      return this.getBalanceView(balance)
    })
  )

  protected override render() {
    return html`${observe(this.balance$, html`<br />`)}`
  }

  private getBalanceView(balance: string) {
    return html` <span>${translate('widgets.swap-form.input.balance.balance')}: ${balance}</span> `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inch-swap-balance': BalanceElement
  }
}
