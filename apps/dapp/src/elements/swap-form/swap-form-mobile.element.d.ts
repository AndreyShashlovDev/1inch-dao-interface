import { IApplicationContext, ISwapContext } from '@1inch-community/models'
import '@1inch-community/ui-components/card'
import '@1inch-community/widgets/swap-form'
import { LitElement } from 'lit'
export declare class SwapFormMobileElement extends LitElement {
  static readonly tagName = 'inch-swap-form-mobile'
  static styles: import('lit').CSSResult[]
  swapContext: ISwapContext
  applicationContext: IApplicationContext
  private isRainbowTheme
  private targetSelectToken
  private readonly mobileOverlay
  private readonly swapFormContainerRef
  private readonly unicornLoaderRef
  protected firstUpdated(): void
  protected render(): import('lit').TemplateResult<1>
  private onChangeFusionInfoOpenState
  private onOpenMobileConfirmSwap
  private onOpenMobileSelectToken
  private onOpenChangeChainView
  private onOpenConnectWalletView
}
