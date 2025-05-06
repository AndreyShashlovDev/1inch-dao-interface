import { appendClass, dispatchEvent, subscribe } from '@1inch-community/core/lit-utils'
import { BigFloat } from '@1inch-community/core/math'
import { IBigFloat } from '@1inch-community/models'
import { html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { fromEvent, tap } from 'rxjs'
import { bigFloatInputStyle } from './big-float-input.style'

@customElement(BigFloatInputElement.tagName)
export class BigFloatInputElement extends LitElement {
  static tagName = 'inch-big-float-input' as const

  static override styles = bigFloatInputStyle

  @property({ type: Object, attribute: false })
  set value(value: IBigFloat) {
    if (!(value instanceof BigFloat)) {
      return
    }
    if (!this._value.equals(value)) {
      this._value = value
      this.input.value = value.toFixedSmart(this.decimals)
    }
  }
  get value() {
    return this._value
  }

  @property({ type: Number, attribute: false }) decimals: number = 6
  @property({ type: Boolean, attribute: false }) disabled = false

  private _value = BigFloat.zero()
  private readonly input = document.createElement('input')

  firstUpdated() {
    appendClass(this.input, {
      input: true,
    })
    if (this.disabled) {
      this.input.setAttribute('disabled', '')
    }
    this.input.setAttribute('inputmode', 'decimal')
    this.input.setAttribute('autocomplete', 'off')
    this.input.setAttribute('placeholder', '0')
    subscribe(
      this,
      [
        fromEvent<KeyboardEvent>(this.input, 'keypress').pipe(
          tap((event) => this.keypressHandler(event))
        ),
        fromEvent<KeyboardEvent>(this.input, 'input').pipe(tap(() => this.inputHandler())),
      ],
      { requestUpdate: false }
    )
  }

  protected render() {
    return html`${this.input}`
  }

  private keypressHandler(event: KeyboardEvent) {
    const char = event.key
    if (char === '.' && this.input.value.length > 0) {
      if (this.input.value.includes('.')) {
        event.preventDefault()
      }
      return
    }
    if (char.length === 1 && !char.match(/[0-9]/)) {
      event.preventDefault()
    }
  }

  private inputHandler() {
    let value = this.input.value
    if (value === '') {
      dispatchEvent(this, 'change', BigFloat.zero())
      return
    }
    let dotOnEnd = false
    if (value[value.length - 1] === '.') {
      value = value.slice(0, value.length - 1)
      dotOnEnd = true
    }
    value = value.replace(/\s+/g, '')
    value = value.replace(/[^0-9.]/g, '')
    const bigFloat = BigFloat.fromString(value)
    let formatedString = bigFloat.toFixedSmart(this.decimals)
    if (dotOnEnd) {
      formatedString += '.'
    }
    this.input.value = formatedString
    if (!this.value.equals(bigFloat)) {
      this._value = bigFloat
      dispatchEvent(this, 'change', this.value)
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [BigFloatInputElement.tagName]: BigFloatInputElement
  }
}
