import { ApplicationContextToken } from '@1inch-community/core/application-context'
import { subscribe } from '@1inch-community/core/lit-utils'
import { getThemeChange } from '@1inch-community/core/theme'
import { AccentColors } from '@1inch-community/models'
import { SwapContextToken } from '@1inch-community/sdk/swap'
import '@1inch-community/ui-components/card'
import { OverlayMobileController } from '@1inch-community/ui-components/overlay'
import { SceneController } from '@1inch-community/ui-components/scene'
import '@1inch-community/widgets/swap-form'
import { consume } from '@lit/context'
import { html, LitElement } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { createRef, ref } from 'lit/directives/ref.js'
import { distinctUntilChanged, map, tap } from 'rxjs'
import { __decorate, __metadata } from 'tslib'
import { swapFormStyle } from './swap-form.style'
import { unicornTouchUpdate } from './unicorn-updater'
import('@1inch-community/widgets/wallet-manage')
import('@1inch-community/widgets/select-token')
import('@1inch-community/ui-components/icon')
let SwapFormMobileElement = class SwapFormMobileElement extends LitElement {
  constructor() {
    super(...arguments)
    this.isRainbowTheme = false
    this.targetSelectToken = null
    this.mobileOverlay = new OverlayMobileController('app-root')
    this.swapFormContainerRef = createRef()
    this.unicornLoaderRef = createRef()
  }
  static {
    this.tagName = 'inch-swap-form-mobile'
  }
  static {
    this.styles = [swapFormStyle, SceneController.styles()]
  }
  firstUpdated() {
    setTimeout(() => this.classList.add('padding-top-transition'), 100)
    subscribe(
      this,
      [
        getThemeChange().pipe(
          map(({ brandColor }) => brandColor),
          distinctUntilChanged(),
          tap((color) => (this.isRainbowTheme = color === AccentColors.rainbow))
        ),
        unicornTouchUpdate(
          this.applicationContext,
          this.swapFormContainerRef,
          this.unicornLoaderRef
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
      <inch-icon ${ref(this.unicornLoaderRef)} class="unicorn-loader" icon="unicornRun"></inch-icon>
      <div ${ref(this.swapFormContainerRef)} class="${classMap(classes)}">
        <inch-card style="max-width: 100vw">
          <inch-swap-form
            @confirmSwap="${(event) => this.onOpenMobileConfirmSwap(event)}"
            @changeFusionInfoOpenState="${(event) => this.onChangeFusionInfoOpenState(event)}"
            @openTokenSelector="${(event) => this.onOpenMobileSelectToken(event)}"
            @changeChain="${() => this.onOpenChangeChainView()}"
            @connectWallet="${() => this.onOpenConnectWalletView()}"
          ></inch-swap-form>
        </inch-card>
      </div>
    `
  }
  onChangeFusionInfoOpenState(event) {
    if (event.detail.value && !this.classList.contains('is-enlarged-form')) {
      this.classList.add('is-enlarged-form')
    }
    if (!event.detail.value && this.classList.contains('is-enlarged-form')) {
      this.classList.remove('is-enlarged-form')
    }
  }
  async onOpenMobileConfirmSwap(event) {
    const swapSnapshot = event.detail.value
    const id = await this.mobileOverlay.open(html`
      <inch-card forMobileView style="width: 100%; height: 100%; display: flex;">
        <inch-confirm-swap
          .swapContext="${this.swapContext}"
          .swapSnapshot="${swapSnapshot}"
          @backCard="${async () => {
            await this.mobileOverlay.close(id)
          }}"
        ></inch-confirm-swap>
      </inch-card>
    `)
  }
  async onOpenMobileSelectToken(event) {
    this.targetSelectToken = event.detail.value
    const id = await this.mobileOverlay.open(html`
      <inch-card forMobileView style="width: 100%; height: 100%; display: flex;">
        <inch-select-token
          .swapContext="${this.swapContext}"
          tokenType="${this.targetSelectToken}"
          @backCard="${() => this.mobileOverlay.close(id)}"
        ></inch-select-token>
      </inch-card>
    `)
  }
  async onOpenChangeChainView() {
    const id = await this.mobileOverlay.open(html`
      <inch-chain-selector-list
        showShadow
        @closeCard="${() => this.mobileOverlay.close(id)}"
        .wallet="${this.applicationContext.wallet}"
      ></inch-chain-selector-list>
    `)
  }
  async onOpenConnectWalletView() {
    const id = await this.mobileOverlay.open(html`
      <inch-wallet-manage
        showShadow
        @closeCard="${() => this.mobileOverlay.close(id)}"
        .controller="${this.applicationContext.wallet}"
      ></inch-wallet-manage>
    `)
  }
}
__decorate(
  [consume({ context: SwapContextToken }), __metadata('design:type', Object)],
  SwapFormMobileElement.prototype,
  'swapContext',
  void 0
)
__decorate(
  [consume({ context: ApplicationContextToken }), __metadata('design:type', Object)],
  SwapFormMobileElement.prototype,
  'applicationContext',
  void 0
)
__decorate(
  [state(), __metadata('design:type', Object)],
  SwapFormMobileElement.prototype,
  'isRainbowTheme',
  void 0
)
SwapFormMobileElement = __decorate(
  [customElement(SwapFormMobileElement.tagName)],
  SwapFormMobileElement
)
export { SwapFormMobileElement }
//# sourceMappingURL=swap-form-mobile.element.js.map
