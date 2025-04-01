import { appendStyle } from '@1inch-community/core/lit-utils'
import { html, render, TemplateResult } from 'lit'
import { fromEvent, Subscription } from 'rxjs'
import { ScrollViewProviderElement } from '../scroll'
import { getContainer } from './overlay-container'
import { IOverlayController } from './overlay-controller.interface'
import { getOverlayId } from './overlay-id-generator'

export class OverlayDesktopController implements IOverlayController {
  get isOpen() {
    return this.activeOverlayMap.size > 0
  }

  private readonly activeOverlayMap = new Map<number, HTMLElement>()
  private readonly subscriptions = new Map<number, Subscription>()

  private readonly container = getContainer()

  private readonly overlayWidth = 540
  private readonly overlayPadding = 8
  private readonly overlayStartPositionPercent = 105

  private get target() {
    return this.targetFactory()
  }

  constructor(
    private readonly targetFactory: () => HTMLElement | null,
    private readonly rootNodeName: string
  ) {}

  isOpenOverlay(overlayId: number): boolean {
    return this.activeOverlayMap.has(overlayId)
  }

  async open(openTarget: TemplateResult | HTMLElement): Promise<number> {
    const overlayContainer = this.createOverlayContainer(openTarget)
    const targetOffset = this.calculateTargetOffset()
    await this.transition(overlayContainer, targetOffset)
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
    await this.transition(overlayContainer, 0, true)

    this.unsubscribe(overlayId)
    overlayContainer.remove()
    this.activeOverlayMap.delete(overlayId)
  }

  private calculateTargetOffset(): number {
    if (!this.target) return 0
    const targetRect = this.target.getBoundingClientRect()
    const windowWidth = window.innerWidth
    const overlayWidth = this.overlayWidth
    const overlap = windowWidth - overlayWidth
    const result = targetRect.right - overlap + this.overlayPadding * 3
    if (targetRect.width + result > windowWidth || result < 0) {
      return 0
    }
    return result
  }

  private getDefaultAnimationOptions() {
    return {
      duration: 500,
      easing: 'cubic-bezier(.2, .8, .2, 1)',
    }
  }

  private async transition(
    overlayContainer: HTMLElement,
    targetOffset: number,
    isBack: boolean = false
  ): Promise<void> {
    const transitionOverlayContainerStart = () => ({
      transform: `translate3d(${isBack ? this.overlayStartPositionPercent : 0}%, 0, 0)`,
    })
    const transitionTargetStart = () => ({
      transform: `translate3d(${isBack ? 0 : -targetOffset}px, 0, 0)`,
    })

    const animateTarget = async () => {
      if (!this.target) return
      if (targetOffset === 0 && !isBack) return
      return this.target.animate([transitionTargetStart()], this.getDefaultAnimationOptions())
        .finished
    }

    await Promise.all([
      overlayContainer.animate(
        [transitionOverlayContainerStart()],
        this.getDefaultAnimationOptions()
      ).finished,
      animateTarget(),
    ])
    appendStyle(overlayContainer, {
      transform: '',
    })
    if (targetOffset !== 0 && this.target) {
      appendStyle(this.target, {
        ...transitionTargetStart(),
      })
    }
    if (isBack && this.target) {
      appendStyle(this.target, {
        transform: '',
      })
    }
  }

  private createOverlayContainer(openTarget: TemplateResult | HTMLElement) {
    const overlayContainer = document.createElement(ScrollViewProviderElement.tagName)
    const overlayIndex = this.activeOverlayMap.size + 1
    const padding = this.overlayPadding
    overlayContainer.maxHeight = window.innerHeight - padding * 2
    overlayContainer.setMaxHeight = true
    overlayContainer.setAttribute('overlay-index', overlayIndex.toString())
    appendStyle(overlayContainer, {
      position: 'fixed',
      display: 'flex',
      width: `${this.overlayWidth}px`,
      overflow: 'hidden',
      alignItems: 'flex-end',
      top: `${padding}px`,
      right: `${padding}px`,
      zIndex: '2000',
      borderRadius: '24px',
      boxSizing: 'border-box',
      boxShadow: '0px 4px 4px -2px rgba(24, 39, 75, 0.08), 0px 2px 4px -2px rgba(24, 39, 75, 0.12)',
      transform: `translate3d(${this.overlayStartPositionPercent}%, 0, 0)`,
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
    this.subscriptions.set(overlayId, subscription)
  }

  private unsubscribe(overlayId: number) {
    if (!this.subscriptions.has(overlayId)) return
    const subscription = this.subscriptions.get(overlayId)!
    if (subscription.closed) return
    subscription.unsubscribe()
    this.subscriptions.delete(overlayId)
  }
}
