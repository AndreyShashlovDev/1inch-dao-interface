import { lazyAppContextConsumer } from '@1inch-community/core/lazy'
import {
  getMobileMatchMediaAndSubscribe,
  subscribe,
  translate,
} from '@1inch-community/core/lit-utils'
import '@1inch-community/ui-components/card'
import { SceneController, shiftAnimation } from '@1inch-community/ui-components/scene'
import { html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { when } from 'lit/directives/when.js'
import { combineLatest, tap } from 'rxjs'
import './account'
import './disconnect'
import './wallet'
import { WalletManagerRouteStyle } from './wallet-manager-route.style'

type Scenes = 'account' | 'wallets' | 'disconnect'

@customElement(WalletManagerRoute.tagName)
export class WalletManagerRoute extends LitElement {
  static tagName = 'inch-wallet-manager-route' as const

  static override styles = [WalletManagerRouteStyle, SceneController.styles()]

  @property({ type: Boolean }) showShadow?: boolean

  private readonly applicationContext = lazyAppContextConsumer(this)

  private readonly mobileMedia = getMobileMatchMediaAndSubscribe(this)

  private readonly scene = new SceneController(
    'account',
    {
      account: {},
      wallets: {},
      disconnect: {},
    },
    shiftAnimation()
  )

  @state() currentSceneName: Scenes = this.scene.activeScene

  protected firstUpdated() {
    const wallet = this.applicationContext.value.wallet

    subscribe(
      this,
      combineLatest([wallet.data.isConnected$, wallet.data.activeAddress$]).pipe(
        tap(([isConnected, address]) => {
          if (!isConnected && address === null && this.currentSceneName !== 'wallets') {
            this.navigateTo('wallets', true)
          }
          if (isConnected && address && this.currentSceneName !== 'account') {
            this.onBackPress()
          }
        })
      )
    )
  }

  private getAccountView() {
    return html`
      <inch-wallet-account-view
        @changeWalletClick="${() => this.navigateTo('wallets')}"
      ></inch-wallet-account-view>
    `
  }

  private getWalletsView() {
    return html` <inch-wallet-manage></inch-wallet-manage> `
  }

  private getDisconnectView() {
    return html` <inch-wallet-disconnect-view></inch-wallet-disconnect-view> `
  }

  private getHeaderView() {
    switch (this.currentSceneName) {
      case 'account':
        return this.accountHeaderView()
      case 'wallets':
        return this.walletsHeaderView()
      case 'disconnect':
        return this.disconnectHeaderView()
      default:
        throw new Error('unknown screen!')
    }
  }

  private accountHeaderView() {
    return html` <inch-card-header
      headerTextPosition="center"
      headerText="${translate('widgets.wallet-manager-route.account')}"
    >
      <inch-button
        slot="right-container"
        @click="${() => this.navigateTo('wallets')}"
        type="secondary"
        size="l"
      >
        <inch-icon icon="plus24"></inch-icon>
      </inch-button>
    </inch-card-header>`
  }

  private walletsHeaderView() {
    const isConnected = this.applicationContext.value.wallet.isConnected
    const title = isConnected
      ? 'widgets.wallet-manager-route.wallets.manager'
      : 'widgets.wallet-manager-route.wallets.connect'

    return html` <inch-card-header
      headerTextPosition="center"
      headerText="${translate(title)}"
      backButton="${ifDefined(isConnected || undefined)}"
      @backCard="${() => this.onBackPress()}"
    >
    </inch-card-header>`
  }

  private disconnectHeaderView() {
    return html` <inch-card-header
      headerTextPosition="center"
      headerText="${translate('widgets.wallet-manager-route.wallets.disconnect')}"
      backButton="${true}"
      @backCard="${() => this.onBackPress()}"
    >
    </inch-card-header>`
  }

  private navigateTo(scene: Scenes, immediate: boolean = false) {
    this.currentSceneName = scene
    this.scene.nextTo(scene, immediate)
  }

  private onBackPress() {
    this.scene.back()
    this.currentSceneName = this.scene.activeScene
  }

  protected render() {
    return html`
      <inch-card class="route-container" showShadow="${ifDefined(this.showShadow)}" overlayView>
        ${when(
          !this.mobileMedia.matches,
          () => html` <inch-card-close-overlay></inch-card-close-overlay> `
        )}
        ${this.getHeaderView()}
        ${this.scene.render({
          account: () => this.getAccountView(),
          wallets: () => this.getWalletsView(),
          disconnect: () => this.getDisconnectView(),
        })}
      </inch-card>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [WalletManagerRoute.tagName]: WalletManagerRoute
  }
}
