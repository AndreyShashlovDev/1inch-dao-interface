import { ApplicationContextToken } from '@1inch-community/core/application-context'
import { ContextProvider } from '@lit/context'
import { css, html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import { getContext } from './context'

@customElement(GlobalApplicationContextElement.tagName)
export class GlobalApplicationContextElement extends LitElement {
  static readonly tagName = 'global-application-context'

  static override readonly styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
  `

  // @provide({ context: ApplicationContextToken })
  // context = getContext()

  constructor() {
    super()
    new ContextProvider(this, { context: ApplicationContextToken, initialValue: getContext() })
  }

  protected render() {
    return html`<slot></slot>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'global-application-context': GlobalApplicationContextElement
  }
}
