import { getMobileMatchMediaAndSubscribe, translate } from '@1inch-community/core/lit-utils'
import '@1inch-community/ui-components/card'
import { SceneController, shiftAnimation } from '@1inch-community/ui-components/scene'
import { html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { when } from 'lit/directives/when.js'
import './account'
import './i18n'
import './wallet'
import { WalletManagerRouteStyle } from './wallet-manager-route.style'

type Scenes = 'account' | 'wallets'

@customElement(WalletManagerRoute.tagName)
export class WalletManagerRoute extends LitElement {
  static tagName = 'inch-wallet-manager-route' as const

  static override styles = [WalletManagerRouteStyle]

  @property({ type: Boolean }) showShadow?: boolean

  private readonly mobileMedia = getMobileMatchMediaAndSubscribe(this)

  @state() currentSceneName: Scenes = 'account'

  /**
   * use it because scene controller return next scene name only after render finished
   * and we end up getting an extra view update (the screen is twitching).
   * @private
   */
  private readonly sceneStack: Scenes[] = [this.currentSceneName]

  private readonly scene = new SceneController(
    this.currentSceneName,
    {
      wallets: {},
      account: {},
    },
    shiftAnimation()
  )

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

  private getHeaderView() {
    if (this.currentSceneName === 'wallets') {
      return this.walletsHeaderView()
    }

    return this.accountHeaderView()
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
    return html` <inch-card-header
      headerTextPosition="center"
      headerText="${translate('widgets.wallet-manager-route.wallets')}"
      backButton="${true}"
      @backCard="${() => this.onBackPress()}"
    >
    </inch-card-header>`
  }

  private navigateTo(scene: Scenes) {
    this.currentSceneName = scene
    this.sceneStack.push(scene)
    this.scene.nextTo(scene)
  }

  private onBackPress() {
    this.sceneStack.pop()
    this.currentSceneName = this.sceneStack[0]
    this.scene.back()
  }

  protected render() {
    return html`
      <inch-card class="route-container" showShadow="${ifDefined(this.showShadow)}">
        ${when(
          !this.mobileMedia.matches,
          () => html` <inch-card-close-overlay></inch-card-close-overlay> `
        )}
        ${this.getHeaderView()}
        ${this.scene.render({
          wallets: () => this.getWalletsView(),
          account: () => this.getAccountView(),
        })}
      </inch-card>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inch-wallet-manager-route': WalletManagerRoute
  }
}
