import { formatHex, FormatHexParams } from '@1inch-community/core/formatters'
import '@1inch-community/ui-components/loaders'
import { html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { Address } from 'viem'
import { tooltip } from '../tooltip'

@customElement(AddressViewElement.tagName)
export class AddressViewElement extends LitElement {
  static tagName = 'inch-address-view' as const

  @property({ type: String, attribute: true }) address?: Address
  @property({ type: Boolean, attribute: true }) hideTooltip: boolean = false
  @property({ type: Object, attribute: false }) formatParams?: FormatHexParams

  render() {
    if (!this.address) {
      return html`<inch-loader-skeleton></inch-loader-skeleton>`
    }
    const formatedAddress = formatHex(this.address, this.formatParams)
    if (this.hideTooltip) {
      return html`<span>${formatedAddress}</span>`
    }
    return html`<span ${tooltip(this.address)}>${formatedAddress}</span>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AddressViewElement.tagName]: AddressViewElement
  }
}
