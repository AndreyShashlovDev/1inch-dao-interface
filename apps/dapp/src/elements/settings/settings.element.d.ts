import { IApplicationContext } from '@1inch-community/models'
import { LitElement } from 'lit'
export declare class Settings extends LitElement {
  static readonly tagName = 'inch-settings'
  static styles: import('lit').CSSResult
  private readonly mobileMedia
  applicationContext: IApplicationContext
  private readonly scene
  protected render(): import('lit').TemplateResult<1>
  private getWidth
}
declare global {
  interface HTMLElementTagNameMap {
    'inch-settings': Settings
  }
}
