import { ApplicationContextToken } from '@1inch-community/core/application-context'
import {
  getMobileMatchMedia,
  getMobileMatchMediaAndSubscribe,
} from '@1inch-community/core/lit-utils'
import { SwapContextToken } from '@1inch-community/sdk/swap'
import '@1inch-community/ui-components/card'
import '@1inch-community/widgets/swap-form'
import { consume, provide } from '@lit/context'
import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import { __decorate, __metadata } from 'tslib'
let SwapFormElement = class SwapFormElement extends LitElement {
  constructor() {
    super(...arguments)
    this.mobileMedia = getMobileMatchMediaAndSubscribe(this)
  }
  static {
    this.tagName = 'inch-swap-form-container'
  }
  async connectedCallback() {
    await this.preloadForm(getMobileMatchMedia().matches)
    super.connectedCallback()
    this.swapContext = await this.applicationContext.makeSwapContext()
    this.requestUpdate()
    this.preloadForm(!this.mobileMedia.matches).catch(console.error)
  }
  disconnectedCallback() {
    super.disconnectedCallback()
    this.swapContext.destroy()
  }
  render() {
    if (!this.swapContext) return
    if (this.mobileMedia.matches) {
      return html`<inch-swap-form-mobile></inch-swap-form-mobile>`
    }
    return html`<inch-swap-form-desktop></inch-swap-form-desktop>`
  }
  async preloadForm(isMobile) {
    if (isMobile) {
      await import('./swap-form-mobile.element')
    } else {
      await import('./swap-form-desktop.element')
    }
  }
}
__decorate(
  [provide({ context: SwapContextToken }), __metadata('design:type', Object)],
  SwapFormElement.prototype,
  'swapContext',
  void 0
)
__decorate(
  [consume({ context: ApplicationContextToken }), __metadata('design:type', Object)],
  SwapFormElement.prototype,
  'applicationContext',
  void 0
)
SwapFormElement = __decorate([customElement(SwapFormElement.tagName)], SwapFormElement)
export { SwapFormElement }
//# sourceMappingURL=swap-form.element.js.map
