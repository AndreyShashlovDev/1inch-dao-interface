import { ApplicationContextToken } from '@1inch-community/core/application-context'
import { changeMobileMatchMedia, getMobileMatchMedia } from '@1inch-community/core/lit-utils'
import { IApplicationContext } from '@1inch-community/models'
import { OverlayMobileController } from '@1inch-community/ui-components/overlay'
import '@1inch-community/widgets/notifications'
import '@1inch-community/widgets/wallet-manage'
import { consume } from '@lit/context'
import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import { styleMap } from 'lit/directives/style-map.js'
import { getFooterHeight } from '../../platform/sizes'
import { footerStyle } from './footer.style'

import('@1inch-community/ui-components/card')
import('../settings')

@customElement(FooterElement.tagName)
export class FooterElement extends LitElement {
  static tagName = 'inch-footer' as const

  static styles = footerStyle

  @consume({ context: ApplicationContextToken })
  applicationContext!: IApplicationContext

  private mobileMedia = getMobileMatchMedia()

  private readonly mobileOverlay = new OverlayMobileController('app-root')

  connectedCallback() {
    super.connectedCallback()
    changeMobileMatchMedia(this)
  }

  protected render() {
    if (this.mobileMedia.matches) {
      return this.getMobileFooter()
    }

    return this.getDesktopFooter()
  }

  private getDesktopFooter() {
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

  private getMobileFooter() {
    return html`
      <div class="footer-container mobile-footer">
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

  private async onOpenSettings() {
    const id = await this.mobileOverlay.open(html`
      <inch-card overlayView>
        <inch-settings @closeSettings="${() => this.mobileOverlay.close(id)}"></inch-settings>
      </inch-card>
    `)
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inch-footer': FooterElement
  }
}
