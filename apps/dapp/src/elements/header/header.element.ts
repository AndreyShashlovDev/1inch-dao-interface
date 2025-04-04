import { ApplicationContextToken } from '@1inch-community/core/application-context'
import { getMobileMatchMediaAndSubscribe, subscribe } from '@1inch-community/core/lit-utils'
import { ChainId, IApplicationContext } from '@1inch-community/models'
import { chainList } from '@1inch-community/sdk/chain'
import '@1inch-community/ui-components/icon'
import '@1inch-community/widgets/chain-selector'
import '@1inch-community/widgets/notifications'
import '@1inch-community/widgets/wallet-manage'
import { consume } from '@lit/context'
import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import { styleMap } from 'lit/directives/style-map.js'
import { when } from 'lit/directives/when.js'
import { getHeaderHeight } from '../../platform/sizes'
import { headerStyle } from './header.style'

@customElement(HeaderElement.tagName)
export class HeaderElement extends LitElement {
  static tagName = 'inch-header' as const

  static override styles = headerStyle

  @consume({ context: ApplicationContextToken })
  applicationContext!: IApplicationContext

  private mobileMedia = getMobileMatchMediaAndSubscribe(this)

  protected firstUpdated() {
    subscribe(this, [this.applicationContext.wallet.data.isConnected$])
  }

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
        ${when(
          this.applicationContext.wallet.isConnected,
          () => html`
            <div class="right-content">
              <inch-chain-selector
                .selectedChainList="${chainList.map((item) => item.chainId)}"
                @changeSelectedChainIdList="${(event: CustomEvent) =>
                  this.onChangeSelectedChainIdList(event.detail.value as ChainId[])}"
              >
              </inch-chain-selector>
              <inch-connect-wallet-view
                .controller="${this.applicationContext.wallet}"
              ></inch-connect-wallet-view>
              <inch-notifications-open-button></inch-notifications-open-button>
            </div>
          `
        )}
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

  private onChangeSelectedChainIdList(value: ChainId[]) {
    /**
     * TODO: onChangeSelectedChainList handler
     */
    console.log(value)
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inch-header': HeaderElement
  }
}
