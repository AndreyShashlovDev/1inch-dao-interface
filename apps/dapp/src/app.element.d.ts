import { IApplicationContext } from '@1inch-community/models'
import '@1inch-community/widgets/notifications'
import { LitElement } from 'lit'
import './elements/footer'
import './elements/header'
import './elements/swap-form'
export declare class AppElement extends LitElement {
  static styles: import('lit').CSSResult[]
  applicationContext: IApplicationContext
  protected firstUpdated(): void
  private init
  protected render(): import('lit').TemplateResult<1>
}
declare global {
  interface HTMLElementTagNameMap {
    'app-root': AppElement
  }
}
