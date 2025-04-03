import { asyncFrame } from '@1inch-community/core/async'
import { html, LitElement, PropertyValues } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { createRef, ref } from 'lit/directives/ref.js'
import { when } from 'lit/directives/when.js'
import { textStyle } from './text.style'

const animationConfig = {
  duration: 200,
  easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
}

@customElement(TextElement.tagName)
export class TextElement extends LitElement {
  static readonly tagName = 'inch-text' as const

  static override styles = textStyle

  @property({ type: String, attribute: true }) text?: string
  @state() private lastText?: string

  private readonly textRef = createRef<HTMLElement>()
  private readonly newTextRef = createRef<HTMLElement>()

  private get isTransitionState() {
    return this.lastText && this.text !== this.lastText
  }

  private get textForRender() {
    return this.isTransitionState ? this.lastText : this.text
  }

  protected override willUpdate(changedProperties: PropertyValues) {
    super.willUpdate(changedProperties)
    if (changedProperties.has('text')) {
      this.lastText = changedProperties.get('text')
    }
  }

  protected async updated(_changedProperties: PropertyValues) {
    super.updated(_changedProperties)
    if (this.isTransitionState) {
      await asyncFrame()
      await this.transition()
    }
  }

  render() {
    return html`
      ${when(
        this.isTransitionState,
        () => html`<span ${ref(this.newTextRef)} class="text new-text">${this.text}</span>`
      )}
      <span class="text" ${ref(this.textRef)}>${this.textForRender}</span>
    `
  }

  private async transition() {
    const textElement = this.textRef.value
    const newTextElement = this.newTextRef.value
    if (!textElement || !newTextElement) return
    const { height: oldHeight, width: oldWidth } = textElement.getBoundingClientRect()
    const { height, width } = newTextElement.getBoundingClientRect()
    await Promise.all([
      textElement.animate(
        [
          { transform: 'translateY(0)', opacity: '1' },
          { transform: 'translateY(100%)', opacity: '0' },
        ],
        animationConfig
      ).finished,
      newTextElement.animate(
        [
          { transform: 'translateY(-100%)', opacity: '0' },
          { transform: 'translateY(0)', opacity: '1' },
        ],
        animationConfig
      ).finished,
      this.animate(
        [
          { width: `${oldWidth}px`, height: `${oldHeight}px` },
          { width: `${width}px`, height: `${height}px` },
        ],
        animationConfig
      ).finished,
    ])
    this.lastText = undefined
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [TextElement.tagName]: TextElement
  }
}
