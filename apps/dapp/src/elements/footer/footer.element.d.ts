import { IApplicationContext } from '@1inch-community/models'
import '@1inch-community/widgets/notifications'
import '@1inch-community/widgets/wallet-manage'
import { LitElement } from 'lit'
export declare class FooterElement extends LitElement {
  static tagName: 'inch-footer'
  static styles: import('lit').CSSResult
  applicationContext: IApplicationContext
  private mobileMedia
  private readonly mobileOverlay
  connectedCallback(): void
  protected render(): import('lit').TemplateResult<1>
  private getDesktopFooter
  private getMobileFooter
  private onOpenSettings
}
declare global {
  interface HTMLElementTagNameMap {
    'inch-footer': FooterElement
  }
}
