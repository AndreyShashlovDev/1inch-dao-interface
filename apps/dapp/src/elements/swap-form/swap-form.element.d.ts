import { IApplicationContext, ISwapContext } from '@1inch-community/models'
import '@1inch-community/ui-components/card'
import '@1inch-community/widgets/swap-form'
import { LitElement } from 'lit'
export declare class SwapFormElement extends LitElement {
  static tagName: 'inch-swap-form-container'
  swapContext: ISwapContext
  applicationContext: IApplicationContext
  private mobileMedia
  connectedCallback(): Promise<void>
  disconnectedCallback(): void
  protected render(): import('lit').TemplateResult<1> | undefined
  private preloadForm
}
declare global {
  interface HTMLElementTagNameMap {
    'inch-swap-form-container': SwapFormElement
  }
}
