import { ApplicationContextToken } from '@1inch-community/core/application-context'
import { subscribe } from '@1inch-community/core/lit-utils'
import { getThemeChange } from '@1inch-community/core/theme'
import { AccentColors } from '@1inch-community/models'
import { SwapContextToken } from '@1inch-community/sdk/swap'
import '@1inch-community/ui-components/button'
import '@1inch-community/ui-components/card'
import { OverlayController } from '@1inch-community/ui-components/overlay'
import { SceneController } from '@1inch-community/ui-components/scene'
import '@1inch-community/widgets/swap-form'
import { consume } from '@lit/context'
import { html, LitElement } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { when } from 'lit/directives/when.js'
import { distinctUntilChanged, map, tap } from 'rxjs'
import { __decorate, __metadata } from 'tslib'
import { swapFormStyle } from './swap-form.style'
import('@1inch-community/widgets/wallet-manage')
import('@1inch-community/widgets/select-token')
import('@1inch-community/ui-components/icon')
import('../settings')
let SwapFormDesktopElement = class SwapFormDesktopElement extends LitElement {
  constructor() {
    super(...arguments)
    this.#isRainbowTheme_accessor_storage = false
    this.targetSelectToken = null
    this.swapSnapshot = null
    this.overlay = new OverlayController('app-root', 'center')
    this.desktopScene = new SceneController('swapForm', {
      swapForm: { minWidth: 556, maxWidth: 556, maxHeight: 625, lazyRender: true },
      selectToken: { minWidth: 556, maxWidth: 556, maxHeight: 680 },
      confirmSwap: { minWidth: 556, maxWidth: 556, maxHeight: 680 },
      settings: { minWidth: 556, maxWidth: 556, maxHeight: 900, lazyRender: true },
    })
  }
  static {
    this.tagName = 'inch-swap-form-desktop'
  }
  static {
    this.styles = [swapFormStyle, SceneController.styles()]
  }
  #isRainbowTheme_accessor_storage
  get isRainbowTheme() {
    return this.#isRainbowTheme_accessor_storage
  }
  set isRainbowTheme(value) {
    this.#isRainbowTheme_accessor_storage = value
  }
  firstUpdated() {
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
  render() {
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
                @confirmSwap="${(event) => this.onOpenConfirmSwap(event)}"
                @changeChain="${() => this.onOpenChangeChainView()}"
                @openTokenSelector="${(event) => this.onOpenSelectToken(event)}"
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
                tokenType="${this.targetSelectToken}"
                @backCard="${() => this.desktopScene.back()}"
              ></inch-select-token>
            `,
            confirmSwap: () =>
              when(
                this.swapSnapshot,
                (swapSnapshot) => html`
                  <inch-confirm-swap
                    .swapSnapshot="${swapSnapshot}"
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
  async onOpenSelectToken(event) {
    this.targetSelectToken = event.detail.value
    await this.desktopScene.nextTo('selectToken')
  }
  async onOpenConfirmSwap(event) {
    this.swapSnapshot = event.detail.value
    await this.desktopScene.nextTo('confirmSwap')
  }
  async onOpenChangeChainView() {
    const id = await this.overlay.open(html`
      <inch-chain-selector-list
        showShadow
        @closeCard="${() => this.overlay.close(id)}"
        .wallet="${this.applicationContext.wallet}"
      ></inch-chain-selector-list>
    `)
  }
  async onOpenConnectWalletView() {
    const id = await this.overlay.open(html`
      <inch-wallet-manage
        showShadow
        @closeCard="${() => this.overlay.close(id)}"
        .controller="${this.applicationContext.wallet}"
      ></inch-wallet-manage>
    `)
  }
}
__decorate(
  [consume({ context: SwapContextToken }), __metadata('design:type', Object)],
  SwapFormDesktopElement.prototype,
  'swapContext',
  void 0
)
__decorate(
  [consume({ context: ApplicationContextToken }), __metadata('design:type', Object)],
  SwapFormDesktopElement.prototype,
  'applicationContext',
  void 0
)
__decorate(
  [state(), __metadata('design:type', Object)],
  SwapFormDesktopElement.prototype,
  'isRainbowTheme',
  null
)
SwapFormDesktopElement = __decorate(
  [customElement(SwapFormDesktopElement.tagName)],
  SwapFormDesktopElement
)
export { SwapFormDesktopElement }
//# sourceMappingURL=swap-form-desktop.element.js.map
