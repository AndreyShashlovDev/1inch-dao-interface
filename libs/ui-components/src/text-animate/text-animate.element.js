import { html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { createRef, ref } from 'lit/directives/ref.js'
import { when } from 'lit/directives/when.js'
import { __decorate, __metadata } from 'tslib'
import { textAnimateStyle } from './text-animate.style'
const animationConfig = {
  duration: 300,
  easing: 'cubic-bezier(0.5, 1.7, 0.5, 1)',
}
let TextAnimateElement = class TextAnimateElement extends LitElement {
  constructor() {
    super(...arguments)
    this.textRef = createRef()
    this.newTextRef = createRef()
  }
  static {
    this.tagName = 'inch-text-animate'
  }
  static {
    this.styles = textAnimateStyle
  }
  get isTransitionState() {
    return this.lastText && this.text !== this.lastText
  }
  get textForRender() {
    return this.isTransitionState ? this.lastText : this.text
  }
  willUpdate(changedProperties) {
    super.willUpdate(changedProperties)
    if (changedProperties.has('text')) {
      this.lastText = changedProperties.get('text')
    }
  }
  async updated(_changedProperties) {
    super.updated(_changedProperties)
    if (this.isTransitionState) {
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
  async transition() {
    const textElement = this.textRef.value
    const newTextElement = this.newTextRef.value
    if (!textElement || !newTextElement) return
    const { height: oldHeight, width: oldWidth } = textElement.getBoundingClientRect()
    const { height, width } = newTextElement.getBoundingClientRect()
    await Promise.all([
      textElement.animate(
        [{ transform: 'translateY(0)' }, { transform: 'translateY(100%)' }],
        animationConfig
      ).finished,
      newTextElement.animate(
        [{ transform: 'translateY(-100%)' }, { transform: 'translateY(0)' }],
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
__decorate(
  [property({ type: String, attribute: true }), __metadata('design:type', String)],
  TextAnimateElement.prototype,
  'text',
  void 0
)
__decorate(
  [state(), __metadata('design:type', String)],
  TextAnimateElement.prototype,
  'lastText',
  void 0
)
TextAnimateElement = __decorate([customElement(TextAnimateElement.tagName)], TextAnimateElement)
export { TextAnimateElement }
//# sourceMappingURL=text-animate.element.js.map
