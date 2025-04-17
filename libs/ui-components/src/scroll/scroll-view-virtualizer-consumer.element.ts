import { lazyConsumer } from '@1inch-community/core/lazy'
import {
  appendStyle,
  getMobileMatchMediaAndSubscribe,
  getMobileMatchMediaEmitter,
  mobileMediaCSS,
  resizeObserver,
  scrollEnd,
  subscribe,
} from '@1inch-community/core/lit-utils'
import { getScrollbarStyle, scrollbarStyle } from '@1inch-community/core/theme'
import '@lit-labs/virtualizer'
import { type LitVirtualizer } from '@lit-labs/virtualizer'
import { virtualizerRef } from '@lit-labs/virtualizer/virtualize.js'
import { css, html, LitElement, TemplateResult } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { createRef, ref } from 'lit/directives/ref.js'
import { when } from 'lit/directives/when.js'
import { fromEvent, merge, tap } from 'rxjs'
import { scrollContext } from './scroll-context'

@customElement(ScrollViewVirtualizerConsumerElement.tagName)
export class ScrollViewVirtualizerConsumerElement extends LitElement {
  static tagName = 'inch-scroll-view-virtualizer-consumer' as const

  static override styles = [
    getScrollbarStyle('lit-virtualizer', true),
    css`
      :host {
        position: relative;
        display: flex;
        flex-direction: column;
      }

      .scroll-header {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: fit-content;
        z-index: 9;
        overflow: hidden;
        box-sizing: border-box;
        background-color: var(--color-background-bg-primary);
      }

      ${mobileMediaCSS(css`
        .scroll-header {
          background-color: transparent;
          -webkit-backdrop-filter: blur(20px);
          backdrop-filter: blur(20px);
          padding: 8px 8px 0 8px;
          top: -8px;
          left: -8px;
          width: 100vw;
          transition: background-color 0.2s;
        }

        .scroll-header-background-color-blur {
          background: var(--primary-12);
          background: linear-gradient(
            to bottom,
            var(--color-background-bg-primary),
            var(--primary-12)
          );
        }
      `)}
    `,
  ]

  @property({ type: Array }) items: unknown[] = []
  @property({ type: Object }) keyFunction?: (item: unknown, index: number) => unknown
  @property({ type: Object }) renderItem?: (item: unknown, index: number) => TemplateResult<1>
  @property({ type: Object }) header?: () => TemplateResult<1>

  private context = lazyConsumer(this, { context: scrollContext, subscribe: true })

  private globalOffsetY: number | null = null

  private readonly virtualizerRef = createRef<LitVirtualizer & VirtualizerHostElement>()
  private readonly headerRef = createRef<HTMLElement>()

  private readonly headerStub = document.createElement('div')

  private readonly mobileMedia = getMobileMatchMediaAndSubscribe(this)

  get virtualizerHost() {
    if (!this.virtualizerRef.value) {
      throw new Error('')
    }
    return this.virtualizerRef.value
  }

  get virtualizer(): Virtualizer | undefined {
    return this.virtualizerHost[virtualizerRef]
  }

  async scrollToIndex(index: number) {
    const normalizeIndex = index + 1 - (this.virtualizer?._first ?? 0)
    const element = this.virtualizer?._children[normalizeIndex]
    if (!element) {
      return
    }
    const rectElement = element.getBoundingClientRect()
    const rectHost = this.virtualizerHost.getBoundingClientRect()
    let top = rectElement.top - rectHost.top + this.virtualizerHost.scrollTop
    if (this.header && this.headerRef.value) {
      top -= this.headerRef.value.offsetHeight
    }
    if (this.virtualizerHost.scrollTop !== top) {
      this.virtualizerHost.scrollTo({ top, behavior: 'smooth' })
      await scrollEnd(this.virtualizerHost)
    }
  }

  protected override firstUpdated() {
    if (!this.virtualizerRef.value) {
      return
    }
    const style = document.createElement('style')
    style.textContent = scrollbarStyle.cssText
    this.virtualizerRef.value.shadowRoot?.appendChild(style)
    this.updateView()
    this.updateHeaderSize()
    subscribe(
      this,
      [
        merge(
          getMobileMatchMediaEmitter(),
          resizeObserver(this.context.value),
          resizeObserver(this.virtualizerHost)
        ).pipe(
          tap(() => {
            this.updateView()
          })
        ),
      ],
      { requestUpdate: false }
    )
    if (this.headerRef.value) {
      subscribe(
        this,
        [
          resizeObserver(this.headerRef.value).pipe(tap(() => this.updateHeaderSize())),
          fromEvent<MouseEvent>(this.virtualizerRef.value, 'scroll', { passive: true }).pipe(
            tap(() => {
              this.context.value.setScrollTopFromConsumer(this.virtualizerRef.value?.scrollTop ?? 0)
              this.updateHeaderBackground()
            })
          ),
        ],
        { requestUpdate: false }
      )
    }
  }

  protected override render() {
    this.updateView()
    this.updateHeaderSize()
    return html`
      ${when(
        this.header,
        (headerFactory) => html`
          <div ${ref(this.headerRef)} class="scroll-header">${headerFactory()}</div>
        `
      )}
      <lit-virtualizer
        ${ref(this.virtualizerRef)}
        scroller
        .items=${this.getItems()}
        .keyFunction="${(item: unknown, index: number) => this.keyFunctionHandler(item, index)}"
        .renderItem=${(item: unknown, index: number) => this.renderItemInternal(item, index)}
      ></lit-virtualizer>
    `
  }

  private updateView() {
    if (this.mobileMedia.matches) {
      this.updateViewMobile()
    } else {
      this.updateViewDesktop()
    }
  }

  private updateViewMobile() {
    if (!this.context || !this.virtualizerRef.value) {
      return
    }
    const contextRect = this.getViewPortBoundingClientRect()
    const virtualizerRect = this.virtualizerHost.getBoundingClientRect()
    this.globalOffsetY = virtualizerRect.top - contextRect.top + 8 * 2
    this.virtualizerHost.style.minHeight = `${(this.context.value.maxHeight ?? 0) - this.globalOffsetY}px`
  }

  private updateViewDesktop() {
    if (!this.context || !this.virtualizerRef.value || !this.headerRef.value) {
      return
    }
    const contextRect = this.getViewPortBoundingClientRect()
    this.virtualizerHost.style.minHeight = `${contextRect.height}px`
  }

  private getViewPortBoundingClientRect() {
    return this.context.value.getBoundingClientRect()
  }

  private getItems() {
    if (this.header) {
      return [null, ...this.items]
    }
    return this.items
  }

  private keyFunctionHandler(item: unknown, index: number) {
    if (this.header && index === 0) {
      return '____header____'
    }
    let normalizerIndex = index
    if (this.header) {
      normalizerIndex -= 1
    }
    if (this.keyFunction) {
      return this.keyFunction(item, normalizerIndex)
    }
    try {
      return `${normalizerIndex}:${JSON.stringify(item)}`
    } catch {
      return normalizerIndex
    }
  }

  private renderItemInternal(item: unknown, index: number): TemplateResult {
    if (this.header && index === 0) {
      return html`${this.headerStub}`
    }
    return this.renderItem?.(item, index - 1) ?? html``
  }

  private updateHeaderSize() {
    if (this.headerRef.value) {
      const rect = this.headerRef.value.getBoundingClientRect()
      appendStyle(this.headerStub, {
        height: `${rect.height}px`,
      })
    }
  }

  private updateHeaderBackground() {
    const top = this.virtualizerRef.value?.scrollTop ?? 0
    if (
      top > 10 &&
      this.headerRef.value &&
      !this.headerRef.value.classList.contains('scroll-header-background-color-blur')
    ) {
      this.headerRef.value.classList.add('scroll-header-background-color-blur')
    }
    if (
      top < 10 &&
      this.headerRef.value &&
      this.headerRef.value.classList.contains('scroll-header-background-color-blur')
    ) {
      this.headerRef.value.classList.remove('scroll-header-background-color-blur')
    }
  }
}

export interface VirtualizerHostElement extends HTMLElement {
  [virtualizerRef]?: Virtualizer
}

interface Virtualizer {
  _first: number
  _children: Array<HTMLElement>
}

declare global {
  interface HTMLElementTagNameMap {
    [ScrollViewVirtualizerConsumerElement.tagName]: ScrollViewVirtualizerConsumerElement
  }
}
