import { IApplicationContext, ISwapContext } from '@1inch-community/models'
import '@1inch-community/ui-components/button'
import '@1inch-community/ui-components/card'
import '@1inch-community/widgets/swap-form'
import { LitElement } from 'lit'
export declare class SwapFormDesktopElement extends LitElement {
  static readonly tagName: 'inch-swap-form-desktop'
  static styles: import('lit').CSSResult[]
  swapContext: ISwapContext
  applicationContext: IApplicationContext
  private accessor isRainbowTheme
  private targetSelectToken
  private swapSnapshot
  private readonly overlay
  private readonly desktopScene
  protected firstUpdated(): void
  protected render(): import('lit').TemplateResult<1>
  private onOpenSelectToken
  private onOpenConfirmSwap
  private onOpenChangeChainView
  private onOpenConnectWalletView
}
