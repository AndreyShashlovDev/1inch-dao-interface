import { resizeObserver, subscribe } from '@1inch-community/core/lit-utils'
import { getScrollbarStyle } from '@1inch-community/core/theme'
import { consume } from '@lit/context'
import { css, html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import { createRef, ref } from 'lit/directives/ref.js'
import { fromEvent, merge, tap } from 'rxjs'
import { ScrollContext, scrollContext } from './scroll-context'

@customElement(ScrollViewConsumerElement.tagName)
export class ScrollViewConsumerElement extends LitElement {
  static tagName = 'inch-scroll-view-consumer' as const

  static override styles = [
    getScrollbarStyle('.scroll-container'),
    css`
      .scroll-container {
        display: block;
        flex-direction: column;
        transition: height 0.1s;
        margin-right: -7px;
        padding-right: 7px;
      }
      .overflow {
        overflow: auto;
        overscroll-behavior: none;
        touch-action: pan-y;
        display: block;
        position: relative;
        contain: size layout;
      }
    `,
  ]

  @consume({ context: scrollContext, subscribe: true })
  private context!: ScrollContext

  private contentRef = createRef<HTMLElement>()
  private scrollContainerRef = createRef<HTMLElement>()

  get contentHeight() {
    return this.contentRef.value?.clientHeight ?? 0
  }

  get scrollContainer() {
    if (!this.scrollContainerRef.value) throw new Error('')
    return this.scrollContainerRef.value
  }

  private globalOffsetY = 0

  protected override firstUpdated() {
    this.updateGlobalOffsetY()
    subscribe(
      this,
      [
        merge(resizeObserver(this.context), resizeObserver(this.contentRef.value!)).pipe(
          tap(() => this.updateView())
        ),
        fromEvent<MouseEvent>(this.scrollContainer, 'scroll', { passive: true }).pipe(
          tap(() => {
            this.context.setScrollTopFromConsumer(this.scrollContainer?.scrollTop ?? 0)
          })
        ),
      ],
      { requestUpdate: false }
    )
  }

  protected override render() {
    return html`
      <div class="scroll-container" ${ref(this.scrollContainerRef)}>
        <div ${ref(this.contentRef)}>
          <slot></slot>
        </div>
      </div>
    `
  }

  private updateGlobalOffsetY() {
    if (!this.context)
      throw new Error('inch-scroll-view-consumer must be used inside inch-scroll-view-provider')
    const scrollContainerRect = this.scrollContainer.getBoundingClientRect()
    this.globalOffsetY = scrollContainerRect.top
  }

  private updateView() {
    if (this.contentHeight > (this.context.maxHeight ?? 0) || this.context.setMaxHeight) {
      this.scrollContainer.style.height = `${(this.context.maxHeight ?? 0) - this.globalOffsetY}px`
      !this.scrollContainer.classList.contains('overflow') &&
        this.scrollContainer.classList.add('overflow')
    } else {
      this.scrollContainer.style.height = `${this.contentHeight}px`
      this.scrollContainer.classList.contains('overflow') &&
        this.scrollContainer.classList.remove('overflow')
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inch-scroll-view-consumer': ScrollViewConsumerElement
  }
}
