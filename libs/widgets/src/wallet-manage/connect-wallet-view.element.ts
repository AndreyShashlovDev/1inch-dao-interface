import { CacheActivePromise } from '@1inch-community/core/decorators'
import { formatHex } from '@1inch-community/core/formatters'
import { lazyAppContextConsumer } from '@1inch-community/core/lazy'
import {
  getMobileMatchMediaAndSubscribe,
  getShadowDomElement,
  observe,
} from '@1inch-community/core/lit-utils'
import { ITokenStorage, IWallet, OverlayViewMode } from '@1inch-community/models'
import '@1inch-community/ui-components/button'
import '@1inch-community/ui-components/icon'
import { html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'
import { defer, map } from 'rxjs'
import './account'
import { connectWalletViewStyle } from './connect-wallet-view.style'
import './elements/wallet-view-address-balance'

@customElement(ConnectWalletViewElement.tagName)
export class ConnectWalletViewElement extends LitElement {
  static tagName = 'inch-connect-wallet-view' as const

  static override styles = connectWalletViewStyle

  @property({ type: Object, attribute: false }) walletController?: IWallet

  @property({ type: Object, attribute: false }) tokenStorageController?: ITokenStorage

  private readonly applicationContext = lazyAppContextConsumer(this)

  private readonly mobileMatchMedia = getMobileMatchMediaAndSubscribe(this)

  private overlayId: number | null = null

  private readonly chainId$ = defer(() => this.getWalletController().data.chainId$)
  private readonly activeAddress$ = defer(() => this.getWalletController().data.activeAddress$)
  private readonly info$ = defer(() => this.getWalletController().data.info$)
  private readonly icon$ = this.info$.pipe(map((item) => item.icon))
  private readonly name$ = this.info$.pipe(map((item) => item.name))
  private readonly activeAddressView$ = this.activeAddress$.pipe(
    map((address) => {
      return address && formatHex(address)
    })
  )

  private readonly view$ = defer(() => this.getWalletController().data.isConnected$).pipe(
    map((isConnected) => {
      return isConnected ? this.getConnectedView() : this.getConnectWalletButton()
    })
  )

  protected override render() {
    return html`${observe(this.view$)}`
  }

  private getConnectedView() {
    return html`
      <div
        class="connect-wallet-view-container"
        @click="${() => this.mobileMatchMedia.matches && this.onOpenAccountView()}"
      >
        <img
          class="connect-wallet-view-icon"
          alt="${observe(this.name$)}"
          src="${observe(this.icon$)}"
        />
        ${when(
          !this.mobileMatchMedia.matches,
          () => html`
            <inch-wallet-view-address-balance
              address="${observe(this.activeAddress$)}"
              chainId="${observe(this.chainId$)}"
            ></inch-wallet-view-address-balance>
            <inch-button @click="${() => this.onOpenAccountView()}" type="secondary" size="m">
              ${observe(this.activeAddressView$)}
            </inch-button>
          `
        )}
      </div>
    `
  }

  private getConnectWalletButton() {
    return html`
      <inch-button
        @click="${() => this.onOpenAccountView()}"
        type="${this.mobileMatchMedia.matches ? 'primary-gray' : 'secondary'}"
        size="${this.mobileMatchMedia.matches ? 'l' : 'xl'}"
      >
        ${when(
          this.mobileMatchMedia.matches,
          () => html` <inch-icon icon="wallet24"></inch-icon>`,
          () => html`<span>Connect wallet</span>`
        )}
      </inch-button>
    `
  }

  private getWalletController(): IWallet {
    if (!this.walletController) {
      throw new Error('')
    }
    return this.walletController
  }

  private getTokenStorageController(): ITokenStorage {
    if (!this.tokenStorageController) {
      throw new Error('')
    }
    return this.tokenStorageController
  }

  @CacheActivePromise()
  private async onOpenAccountView() {
    if (this.applicationContext.value.overlay.isOpenOverlay(this.overlayId)) {
      await this.applicationContext.value.overlay.close(this.overlayId)
      this.overlayId = null
      return
    }
    this.overlayId = await this.applicationContext.value.overlay.open(
      html`
        <inch-wallet-account-view
          @closeCard="${() => {
            if (!this.overlayId) {
              return
            }
            this.applicationContext.value.overlay.close(this.overlayId)
            this.overlayId = null
          }}"
          .walletController="${this.getWalletController()}"
          .tokenStorageController="${this.getTokenStorageController()}"
        ></inch-wallet-account-view>
      `,
      { targetFactory: () => getShadowDomElement('swap-form'), mode: OverlayViewMode.auto }
    )
  }

  @CacheActivePromise()
  private async onOpenConnectView() {
    if (this.applicationContext.value.overlay.isOpenOverlay(this.overlayId)) {
      await this.applicationContext.value.overlay.close(this.overlayId)
      this.overlayId = null
      return
    }
    this.overlayId = await this.applicationContext.value.overlay.open(
      html`
        <inch-wallet-manage
          @closeCard="${() => {
            if (!this.overlayId) {
              return
            }
            this.applicationContext.value.overlay.close(this.overlayId)
            this.overlayId = null
          }}"
          .controller="${this.getWalletController()}"
        ></inch-wallet-manage>
      `,
      { targetFactory: () => getShadowDomElement('swap-form'), mode: OverlayViewMode.auto }
    )
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inch-connect-wallet-view': ConnectWalletViewElement
  }
}
