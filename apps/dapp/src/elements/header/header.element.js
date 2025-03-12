import { ApplicationContextToken } from '@1inch-community/core/application-context'
import { getMobileMatchMediaAndSubscribe } from '@1inch-community/core/lit-utils'
import '@1inch-community/ui-components/icon'
import '@1inch-community/widgets/notifications'
import '@1inch-community/widgets/wallet-manage'
import { consume } from '@lit/context'
import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import { styleMap } from 'lit/directives/style-map.js'
import { __decorate, __metadata } from 'tslib'
import { getHeaderHeight } from '../../platform/sizes'
import { headerStyle } from './header.style'
let HeaderElement = class HeaderElement extends LitElement {
  constructor() {
    super(...arguments)
    this.mobileMedia = getMobileMatchMediaAndSubscribe(this)
  }
  static {
    this.tagName = 'inch-header'
  }
  static {
    this.styles = headerStyle
  }
  render() {
    if (this.mobileMedia.matches) {
      return this.getMobileHeader()
    }
    return this.getDesktopHeader()
  }
  getDesktopHeader() {
    const styles = {
      height: `${getHeaderHeight()}px`,
    }
    return html`
      <div class="header-container" style="${styleMap(styles)}">
        <div class="left-content">
          <inch-icon icon="logoFull"></inch-icon>
        </div>
        <div class="right-content">
          <inch-chain-selector
            .controller="${this.applicationContext.wallet}"
          ></inch-chain-selector>
          <inch-connect-wallet-view
            .controller="${this.applicationContext.wallet}"
          ></inch-connect-wallet-view>
          <inch-notifications-open-button></inch-notifications-open-button>
        </div>
      </div>
    `
  }
  getMobileHeader() {
    return html`
      <div class="header-container mobile-header">
        <inch-icon icon="logoFull"></inch-icon>
      </div>
    `
  }
}
__decorate(
  [consume({ context: ApplicationContextToken }), __metadata('design:type', Object)],
  HeaderElement.prototype,
  'applicationContext',
  void 0
)
HeaderElement = __decorate([customElement(HeaderElement.tagName)], HeaderElement)
export { HeaderElement }
//# sourceMappingURL=header.element.js.map
