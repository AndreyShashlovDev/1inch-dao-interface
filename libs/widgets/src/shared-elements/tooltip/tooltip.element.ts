import { html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { tooltipStyle } from './tooltip.style'

@customElement(TooltipElement.tagName)
export class TooltipElement extends LitElement {
  static tagName = 'inch-tooltip' as const

  static override styles = tooltipStyle

  @property({ type: String, attribute: true }) text?: string

  render() {
    return html`${this.text}`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [TooltipElement.tagName]: TooltipElement
  }
}
