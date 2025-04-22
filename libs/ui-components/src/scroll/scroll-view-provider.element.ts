import { lazyConsumer, lazyProvider } from '@1inch-community/core/lazy'
import { appendStyle } from '@1inch-community/core/lit-utils'
import { css, html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { BehaviorSubject } from 'rxjs'
import { ScrollContext, scrollContext } from './scroll-context'

@customElement(ScrollViewProviderElement.tagName)
export class ScrollViewProviderElement extends LitElement implements ScrollContext {
  static tagName = 'inch-scroll-view-provider' as const

  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      position: relative;
    }
  `

  readonly scrollTopFromConsumer$ = new BehaviorSubject<number>(0)
  readonly showStubView$ = new BehaviorSubject<boolean>(false)

  get scrollTopFromConsumer() {
    return this.scrollTopFromConsumer$.value ?? 0
  }

  @property({ type: Number, attribute: false }) maxHeight?: number

  @property({ type: Boolean, attribute: false }) setMaxHeight?: boolean

  private readonly context = lazyProvider(this, { context: scrollContext })
  private readonly contextParent = lazyConsumer(this, { context: scrollContext })

  setScrollTopFromConsumer(state: number): void {
    this.scrollTopFromConsumer$.next(state)
  }

  onChangeStubView(state: boolean): void {
    this.showStubView$.next(state)
  }

  protected override firstUpdated() {
    if (this.contextParent.isInit) {
      this.context.set(this.contextParent.value)
    } else {
      this.context.set(this)
    }
  }

  protected override updated() {
    if (this.contextParent.isInit) return
    appendStyle(this, {
      maxHeight: this.maxHeight ? `${this.maxHeight}px` : '',
      height: this.setMaxHeight ? `${this.maxHeight}px` : '',
    })
  }

  protected override render() {
    return html`<slot></slot>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inch-scroll-view-provider': ScrollViewProviderElement
  }
}
