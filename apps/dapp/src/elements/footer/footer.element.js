import { ApplicationContextToken } from '@1inch-community/core/application-context'
import { changeMobileMatchMedia, getMobileMatchMedia } from '@1inch-community/core/lit-utils'
import { OverlayMobileController } from '@1inch-community/ui-components/overlay'
import '@1inch-community/widgets/notifications'
import '@1inch-community/widgets/wallet-manage'
import { consume } from '@lit/context'
import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import { styleMap } from 'lit/directives/style-map.js'
import { __decorate, __metadata } from 'tslib'
import { getFooterHeight } from '../../platform/sizes'
import { footerStyle } from './footer.style'
import('@1inch-community/ui-components/card')
import('../settings')
let FooterElement = class FooterElement extends LitElement {
  constructor() {
    super(...arguments)
    this.mobileMedia = getMobileMatchMedia()
    this.mobileOverlay = new OverlayMobileController('app-root')
  }
  static {
    this.tagName = 'inch-footer'
  }
  static {
    this.styles = footerStyle
  }
  connectedCallback() {
    super.connectedCallback()
    changeMobileMatchMedia(this)
  }
  render() {
    if (this.mobileMedia.matches) {
      return this.getMobileFooter()
    }
    return this.getDesktopFooter()
  }
  getDesktopFooter() {
    const styles = {
      height: `${getFooterHeight()}px`,
    }
    return html`
      <div class="footer-container" style="${styleMap(styles)}">
        <span class="power-by">© ${new Date().getFullYear()} Powered by 1inch</span>
        <span class="version"
          >version: ${this.applicationContext.environment.get('appVersion')}</span
        >
      </div>
    `
  }
  getMobileFooter() {
    return html`
      <div class="footer-container mobile-footer">
        <inch-chain-selector .controller="${this.applicationContext.wallet}"></inch-chain-selector>
        <inch-connect-wallet-view
          .controller="${this.applicationContext.wallet}"
        ></inch-connect-wallet-view>

        <inch-notifications-open-button></inch-notifications-open-button>

        <inch-button @click="${() => this.onOpenSettings()}" type="primary-gray" size="l">
          <inch-icon icon="settings24"></inch-icon>
        </inch-button>
      </div>
    `
  }
  async onOpenSettings() {
    const id = await this.mobileOverlay.open(html`
      <inch-card forMobileView>
        <inch-settings @closeSettings="${() => this.mobileOverlay.close(id)}"></inch-settings>
      </inch-card>
    `)
  }
}
__decorate(
  [consume({ context: ApplicationContextToken }), __metadata('design:type', Object)],
  FooterElement.prototype,
  'applicationContext',
  void 0
)
FooterElement = __decorate([customElement(FooterElement.tagName)], FooterElement)
export { FooterElement }
//# sourceMappingURL=footer.element.js.map
