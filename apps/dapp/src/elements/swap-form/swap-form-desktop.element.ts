import { ApplicationContextToken } from '@1inch-community/core/application-context'
import {
  AccentColors,
  IApplicationContext,
  ISwapContext,
  SwapSnapshot,
  TokenType,
} from '@1inch-community/models'
import { SwapContextToken } from '@1inch-community/sdk/swap'
import { OverlayController } from '@1inch-community/ui-components/overlay'
import { SceneController } from '@1inch-community/ui-components/scene'
import { consume } from '@lit/context'
import { html, LitElement } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { when } from 'lit/directives/when.js'
import { swapFormStyle } from './swap-form.style'

import { subscribe } from '@1inch-community/core/lit-utils'
import { getThemeChange } from '@1inch-community/core/theme'
import '@1inch-community/ui-components/button'
import '@1inch-community/ui-components/card'
import '@1inch-community/widgets/swap-form'
import { distinctUntilChanged, map, tap } from 'rxjs'

import('@1inch-community/widgets/wallet-manage')
import('@1inch-community/widgets/select-token')
import('@1inch-community/ui-components/icon')
import('../settings')

@customElement(SwapFormDesktopElement.tagName)
export class SwapFormDesktopElement extends LitElement {
  static readonly tagName = 'inch-swap-form-desktop' as const

  static styles = [swapFormStyle, SceneController.styles()]

  @consume({ context: SwapContextToken })
  swapContext!: ISwapContext

  @consume({ context: ApplicationContextToken })
  applicationContext!: IApplicationContext

  @state()
  private accessor isRainbowTheme = false

  private targetSelectToken: TokenType | null = null

  private swapSnapshot: SwapSnapshot | null = null

  private readonly overlay = new OverlayController('app-root', 'center')

  private readonly desktopScene = new SceneController('swapForm', {
    swapForm: { minWidth: 556, maxWidth: 556, maxHeight: 625, lazyRender: true },
    selectToken: { minWidth: 556, maxWidth: 556, maxHeight: 680 },
    confirmSwap: { minWidth: 556, maxWidth: 556, maxHeight: 680 },
    settings: { minWidth: 556, maxWidth: 556, maxHeight: 900, lazyRender: true },
  })

  protected firstUpdated() {
    subscribe(
      this,
      [
        getThemeChange().pipe(
          map(({ brandColor }) => brandColor),
          distinctUntilChanged(),
          tap((color) => (this.isRainbowTheme = color === AccentColors.rainbow))
        ),
      ],
      { requestUpdate: false }
    )
  }

  protected render() {
    const classes = {
      'shadow-container': true,
      'shadow-container-rainbow': this.isRainbowTheme,
    }
    return html`
      <div class="${classMap(classes)}">
        <inch-card>
          ${this.desktopScene.render({
            swapForm: () => html`
              <inch-swap-form
                @confirmSwap="${(event: CustomEvent) => this.onOpenConfirmSwap(event)}"
                @changeChain="${() => this.onOpenChangeChainView()}"
                @openTokenSelector="${(event: CustomEvent) => this.onOpenSelectToken(event)}"
                @connectWallet="${() => this.onOpenConnectWalletView()}"
              >
                <div slot="header">
                  <inch-button
                    @click="${() => this.desktopScene.nextTo('settings')}"
                    type="tertiary-gray"
                    size="l"
                  >
                    <inch-icon icon="settings24"></inch-icon>
                  </inch-button>
                </div>
              </inch-swap-form>
            `,
            selectToken: () => html`
              <inch-select-token
                tokenType="${this.targetSelectToken!}"
                @backCard="${() => this.desktopScene.back()}"
              ></inch-select-token>
            `,
            confirmSwap: () =>
              when(
                this.swapSnapshot,
                (swapSnapshot) => html`
                  <inch-confirm-swap
                    .swapSnapshot="${swapSnapshot as any}"
                    @backCard="${async () => {
                      await this.desktopScene.back()
                      this.swapSnapshot = null
                    }}"
                  ></inch-confirm-swap>
                `
              ),
            settings: () => html`
              <inch-settings @closeSettings="${() => this.desktopScene.back()}"></inch-settings>
            `,
          })}
        </inch-card>
      </div>
    `
  }

  private async onOpenSelectToken(event: CustomEvent) {
    this.targetSelectToken = event.detail.value
    await this.desktopScene.nextTo('selectToken')
  }

  private async onOpenConfirmSwap(event: CustomEvent) {
    this.swapSnapshot = event.detail.value
    await this.desktopScene.nextTo('confirmSwap')
  }

  private async onOpenChangeChainView() {
    const id = await this.overlay.open(html`
      <inch-chain-selector-list
        showShadow
        @closeCard="${() => this.overlay.close(id)}"
        .wallet="${this.applicationContext.wallet}"
      ></inch-chain-selector-list>
    `)
  }

  private async onOpenConnectWalletView() {
    const id = await this.overlay.open(html`
      <inch-wallet-manage
        showShadow
        @closeCard="${() => this.overlay.close(id)}"
        .controller="${this.applicationContext.wallet}"
      ></inch-wallet-manage>
    `)
  }
}
