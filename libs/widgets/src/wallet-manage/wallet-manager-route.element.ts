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
import { DisconnectEventModel } from './disconnect/disconnect-event-model'
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

  private disconnectData: DisconnectEventModel | null = null

  private readonly scene = new SceneController(
    'account',
    {
      account: {},
      wallets: {},
      disconnect: {},
    },
    shiftAnimation()
  )

  @state() private currentSceneName: Scenes = this.scene.activeScene

  @state() private isWalletConnected: boolean = false

  protected firstUpdated() {
    const wallet = this.applicationContext.value.wallet

    subscribe(
      this,
      combineLatest([wallet.data.isConnected$, wallet.data.activeAddress$]).pipe(
        tap(([isConnected, address]) => {
          if (this.isWalletConnected !== isConnected) {
            this.isWalletConnected = isConnected
          }

          if (!isConnected && address === null && this.currentSceneName !== 'wallets') {
            this.scene.resetScene()
            this.navigateTo('wallets', true)
          }
          if (isConnected && address && this.currentSceneName !== 'account') {
            this.onBackPress()
          }
        })
      ),
      { requestUpdate: false }
    )
  }

  private getAccountView() {
    return html`
      <inch-wallet-account-view
        @changeWalletClick="${() => this.navigateTo('wallets')}"
        @disconnectEvent="${(event: CustomEvent) => this.onDisconnectClick(event.detail.value)}"
      ></inch-wallet-account-view>
    `
  }

  private getWalletsView() {
    return html`
      <inch-wallet-manage
        @disconnectEvent="${(event: CustomEvent) => this.onDisconnectClick(event.detail.value)}"
      ></inch-wallet-manage>
    `
  }

  private getDisconnectView() {
    const data = { ...this.disconnectData }
    this.disconnectData = null

    return html`
      <inch-wallet-disconnect-view
        .data="${data}"
        @onBackClick="${() => this.onBackPress()}"
      ></inch-wallet-disconnect-view>
    `
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
        throw new Error('unknown screen!', this.currentSceneName)
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
    const title = this.isWalletConnected
      ? 'widgets.wallet-manager-route.wallets.manager'
      : 'widgets.wallet-manager-route.wallets.connect'

    return html` <inch-card-header
      headerTextPosition="center"
      headerText="${translate(title)}"
      backButton="${ifDefined(this.isWalletConnected || undefined)}"
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

  private onDisconnectClick(event: DisconnectEventModel) {
    this.disconnectData = event
    this.navigateTo('disconnect')
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
