import { translate } from '@1inch-community/core/lit-utils'
import { TokenRecordId, TokenType } from '@1inch-community/models'
import '@1inch-community/ui-components/button'
import { html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'
import { Address } from 'viem'
import '../../../../../shared-elements/balance-view'
import { tokenBalanceAndMaxButtonStyle } from './token-balance-and-max-button.style'

@customElement(TokenBalanceAndMaxButtonElement.tagName)
export class TokenBalanceAndMaxButtonElement extends LitElement {
  static tagName = 'inch-token-balance-and-max-button' as const

  static override styles = tokenBalanceAndMaxButtonStyle

  @property({ type: String, attribute: false }) tokenType?: TokenType
  @property({ type: String, attribute: false }) tokenId?: TokenRecordId
  @property({ type: String, attribute: false }) walletAddress?: Address
  @property({ type: String, attribute: false }) symbol?: string

  protected render() {
    if (!this.tokenId || !this.walletAddress || !this.symbol) {
      return html``
    }
    return html`
      <span>${translate('widgets.swap-form.input.balance.balance')}:</span>
      <inch-token-balance
        .tokenId="${this.tokenId}"
        .symbol="${this.symbol}"
        .walletAddress="${this.walletAddress}"
      ></inch-token-balance>
      ${when(
        this.tokenType === 'source',
        () => html`<inch-button size="xs" type="secondary">MAX</inch-button>`
      )}
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [TokenBalanceAndMaxButtonElement.tagName]: TokenBalanceAndMaxButtonElement
  }
}
