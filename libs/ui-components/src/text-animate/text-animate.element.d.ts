import { LitElement, PropertyValues } from 'lit'
export declare class TextAnimateElement extends LitElement {
  static readonly tagName: 'inch-text-animate'
  static styles: import('lit').CSSResult
  text?: string
  private lastText?
  private readonly textRef
  private readonly newTextRef
  private get isTransitionState()
  private get textForRender()
  protected willUpdate(changedProperties: PropertyValues): void
  protected updated(_changedProperties: PropertyValues): Promise<void>
  render(): import('lit').TemplateResult<1>
  private transition
}
declare global {
  interface HTMLElementTagNameMap {
    [TextAnimateElement.tagName]: TextAnimateElement
  }
}
