import { asyncFrame } from '@1inch-community/core/async'
import { appendStyle, isRTLCurrentLocale } from '@1inch-community/core/lit-utils'
import { IOverlayController, OverlayViewConfig } from '@1inch-community/models'
import { ScrollViewProviderElement } from '@1inch-community/ui-components/scroll'
import { ContextProvider } from '@lit/context'
import { html, render, TemplateResult } from 'lit'
import { fromEvent, Subscription } from 'rxjs'
import { getContainer } from './overlay-container'
import { overlayContextToken } from './overlay-context.token'
import { getOverlayId } from './overlay-id-generator'
import { viewConfigDefault } from './overlay-view-config-default'

export class OverlayPopupController implements IOverlayController {
  private readonly activeOverlayMap = new Map<number, HTMLElement>()
  private readonly subscriptions = new Map<number, Subscription>()

  private readonly container = getContainer()

  constructor(
    private readonly targetFactory: () => HTMLElement | null,
    private readonly rootNodeName: string
  ) {}

  isOpenOverlay(overlayId: number): overlayId is number {
    return this.activeOverlayMap.has(overlayId)
  }

  async open(
    openTarget: TemplateResult | HTMLElement,
    viewConfig: OverlayViewConfig = viewConfigDefault
  ): Promise<number> {
    const overlayContainer = this.createOverlayContainer(openTarget, viewConfig)
    await asyncFrame()
    const position = await this.getPosition(overlayContainer)
    overlayContainer.maxHeight = position[2]
    appendStyle(overlayContainer, {
      top: `${position[1]}px`,
      left: `${position[0]}px`,
      borderRadius: '24px',
      boxShadow: `0 -3px 4px 0 var(--primary-12), 0 6px 12px 0 var(--primary-12)`,
    })

    await this.animateEnter(overlayContainer, position[3])

    const id = getOverlayId()
    this.activeOverlayMap.set(id, overlayContainer)
    this.subscribe(id)
    return id
  }

  async close(overlayId: number) {
    if (!this.activeOverlayMap.has(overlayId)) {
      return
    }
    const overlayContainer = this.activeOverlayMap.get(overlayId)!

    await this.animateLeave(overlayContainer)

    this.unsubscribe(overlayId)
    overlayContainer.remove()
    this.activeOverlayMap.delete(overlayId)
  }

  private async getPosition(
    openTarget: HTMLElement
  ): Promise<[number, number, number, DOMRect | null]> {
    const offset = 8
    const rect = this.targetFactory()!.getBoundingClientRect()
    const rectContent = openTarget.getBoundingClientRect()
    let left = rect.right - rectContent.width
    if (left <= 0) {
      left = rect.left
    }
    const top = rect.top + rect.height + offset
    const maxHeight = window.innerHeight - top - offset
    return [left, top, maxHeight, rect]
  }

  private createOverlayContainer(
    openTarget: TemplateResult | HTMLElement,
    viewConfig: OverlayViewConfig
  ) {
    const overlayContainer = document.createElement(ScrollViewProviderElement.tagName)
    appendStyle(overlayContainer, {
      position: 'absolute',
      display: 'flex',
      overflow: 'hidden',
      alignItems: 'flex-end',
      width: 'fit-content',
      height: 'fit-content',
      zIndex: '2000',
    })
    new ContextProvider(overlayContainer, {
      context: overlayContextToken,
      initialValue: { config: viewConfig },
    })
    render(html`${openTarget}`, overlayContainer)
    this.container.appendChild(overlayContainer)
    return overlayContainer
  }

  private subscribe(overlayId: number) {
    const subscription = new Subscription()
    const overlayContainer = this.activeOverlayMap.get(overlayId)
    if (!overlayContainer) return
    subscription.add(fromEvent(window, 'resize').subscribe(() => this.close(overlayId).catch()))
    const rootNode = document.querySelector(this.rootNodeName) as HTMLElement
    subscription.add(fromEvent(rootNode, 'scroll').subscribe(() => this.updatePosition(overlayId)))
    subscription.add(
      fromEvent(overlayContainer, 'click').subscribe((event) => {
        event.stopPropagation()
        event.preventDefault()
      })
    )
    subscription.add(
      fromEvent(document, 'click').subscribe(() => {
        this.close(overlayId).catch()
      })
    )
    this.subscriptions.set(overlayId, subscription)
  }

  private unsubscribe(overlayId: number) {
    if (!this.subscriptions.has(overlayId)) return
    const subscription = this.subscriptions.get(overlayId)!
    if (subscription.closed) return
    subscription.unsubscribe()
  }

  private updatePosition(overlayId: number) {
    if (!this.activeOverlayMap.has(overlayId)) {
      return
    }
    const overlayContainer = this.activeOverlayMap.get(overlayId)!
    const target = this.targetFactory()
    if (target !== null) {
      const rect = target.getBoundingClientRect()
      const rectContent = overlayContainer.getBoundingClientRect()
      const top = rect.top + rect.height + 8
      const left = rect.right - rectContent.width
      appendStyle(overlayContainer, {
        top: `${top}px`,
        left: `${left}px`,
      })
    }
  }

  private async animateEnter(overlayContainer: HTMLElement, targetRect: DOMRect | null) {
    const options = {
      duration: 500,
      easing: 'cubic-bezier(.2, .8, .2, 1)',
    }

    if (!targetRect) {
      throw new Error('')
    }

    await overlayContainer.animate(
      [
        { transform: `translate3d(${isRTLCurrentLocale() ? -5 : 5}%, -5%, 0)`, opacity: 0.3 },
        { transform: 'translate3d(0, 0, 0)', opacity: 1 },
      ],
      options
    ).finished
  }

  private async animateLeave(overlayContainer: HTMLElement) {
    const options = {
      duration: 500,
      easing: 'cubic-bezier(.2, .8, .2, 1)',
    }

    await overlayContainer.animate(
      [
        { transform: 'translate3d(0, 0, 0)', opacity: 1 },
        { transform: `translate3d(${isRTLCurrentLocale() ? -5 : 5}%, -5%, 0)`, opacity: 0 },
      ],
      options
    ).finished
  }
}
