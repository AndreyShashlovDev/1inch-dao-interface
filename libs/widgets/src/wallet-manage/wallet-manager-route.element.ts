import { lazyAppContextConsumer } from '@1inch-community/core/lazy'
import { getMobileMatchMediaAndSubscribe } from '@1inch-community/core/lit-utils'
import '@1inch-community/ui-components/card'
import { SceneController, shiftAnimation } from '@1inch-community/ui-components/scene'
import { html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { when } from 'lit/directives/when.js'
import { WalletManagerRouteStyle } from './wallet-manager.route.style'

@customElement(WalletManagerRoute.tagName)
export class WalletManagerRoute extends LitElement {
  static tagName = 'inch-wallet-manager-route' as const

  static override styles = [WalletManagerRouteStyle]

  @property({ type: Boolean }) showShadow?: boolean

  private readonly mobileMedia = getMobileMatchMediaAndSubscribe(this)
  private readonly applicationContext = lazyAppContextConsumer(this)

  private readonly scene = new SceneController(
    'account',
    {
      wallets: {
        minWidth: 0,
        maxWidth: 0,
        maxHeight: 180,
        minHeight: 180,
      },
      account: {
        minWidth: 0,
        maxWidth: 0,
        maxHeight: 240,
        minHeight: 240,
      },
    },
    shiftAnimation()
  )

  private getAccountView() {
    return html`
      <inch-wallet-account-view
        @changeWalletClick="${() => this.scene.nextTo('wallets')}"
      ></inch-wallet-account-view>
    `
  }

  private getWalletsView() {
    return html`
      <inch-wallet-manage @changeWalletClick="${() => console.log('CLIECK')}"></inch-wallet-manage>
    `
  }

  protected render() {
    //fixme use it =)
    const headerText = this.applicationContext.value.wallet.isConnected
      ? 'Wallet management'
      : 'Connect wallet'

    console.log(this.scene.getCurrentSceneName())
    return html`
      <inch-card class="route-container" showShadow="${ifDefined(this.showShadow)}">
        ${when(
          !this.mobileMedia.matches,
          () => html` <inch-card-close-overlay></inch-card-close-overlay> `
        )}
        <inch-card-header headerText="${'some'}"></inch-card-header>
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
