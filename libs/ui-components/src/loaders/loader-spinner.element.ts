import { appendStyle } from '@1inch-community/core/lit-utils'
import { css, html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement(LoaderSpinnerElement.tagName)
export class LoaderSpinnerElement extends LitElement {
  static tagName = 'inch-loader-spinner' as const

  static override styles = css`
    :host {
      display: block;
      cursor: wait;
      border-radius: 50%;
      border: 2px solid;
      box-sizing: border-box;
      color: var(--color-content-content-tertiary);
      border-bottom-color: var(--secondary);
      border-top-color: var(--secondary);
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }

      100% {
        transform: rotate(360deg);
      }
    }
  `

  @property({ type: Number, attribute: true }) size: number = 24

  protected render(): unknown {
    appendStyle(this, {
      width: `${this.size}px`,
      height: `${this.size}px`,
    })
    return html``
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [LoaderSpinnerElement.tagName]: LoaderSpinnerElement
  }
}
