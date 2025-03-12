import { ApplicationContextToken } from '@1inch-community/core/application-context'
import { getMobileMatchMediaAndSubscribe } from '@1inch-community/core/lit-utils'
import { IApplicationContext } from '@1inch-community/models'
import '@1inch-community/ui-components/icon'
import '@1inch-community/widgets/notifications'
import '@1inch-community/widgets/wallet-manage'
import { consume } from '@lit/context'
import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import { styleMap } from 'lit/directives/style-map.js'
import { getHeaderHeight } from '../../platform/sizes'
import { headerStyle } from './header.style'

@customElement(HeaderElement.tagName)
export class HeaderElement extends LitElement {
  static tagName = 'inch-header' as const

  static override styles = headerStyle

  @consume({ context: ApplicationContextToken })
  applicationContext!: IApplicationContext

  private mobileMedia = getMobileMatchMediaAndSubscribe(this)

  protected render() {
    if (this.mobileMedia.matches) {
      return this.getMobileHeader()
    }

    return this.getDesktopHeader()
  }

  private getDesktopHeader() {
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

  private getMobileHeader() {
    return html`
      <div class="header-container mobile-header">
        <inch-icon icon="logoFull"></inch-icon>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inch-header': HeaderElement
  }
}
