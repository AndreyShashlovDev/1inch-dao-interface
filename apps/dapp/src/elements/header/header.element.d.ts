import { IApplicationContext } from '@1inch-community/models'
import '@1inch-community/ui-components/icon'
import '@1inch-community/widgets/notifications'
import '@1inch-community/widgets/wallet-manage'
import { LitElement } from 'lit'
export declare class HeaderElement extends LitElement {
  static tagName: 'inch-header'
  static styles: import('lit').CSSResult
  applicationContext: IApplicationContext
  private mobileMedia
  protected render(): import('lit').TemplateResult<1>
  private getDesktopHeader
  private getMobileHeader
}
declare global {
  interface HTMLElementTagNameMap {
    'inch-header': HeaderElement
  }
}
