import { dispatchEvent, getMobileMatchMediaAndSubscribe } from '@1inch-community/core/lit-utils'
import { ChainId, ChainViewFull, OverlayViewMode } from '@1inch-community/models'
import { chainList } from '@1inch-community/sdk/chain'
import '@1inch-community/ui-components/button'
import '@1inch-community/ui-components/icon'
import { OverlayController } from '@1inch-community/ui-components/overlay'
import '@1inch-community/ui-components/text-animate'
import { html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { map } from 'lit/directives/map.js'
import { styleMap } from 'lit/directives/style-map.js'
import { when } from 'lit/directives/when.js'
import { chainSelectorStyle } from './chain-selector.style'
import './elements/chain-selector-list'

@customElement(ChainSelectorElement.tagName)
export class ChainSelectorElement extends LitElement {
  static tagName = 'inch-chain-selector' as const

  static override styles = chainSelectorStyle

  private defaultChainView: ChainViewFull = chainList[0]

  @property({ type: Array, attribute: false }) selectedChainIdList: ChainId[] = [
    this.defaultChainView.chainId,
  ]

  private readonly mobileMedia = getMobileMatchMediaAndSubscribe(this)

  private readonly overlay = new OverlayController('#app-root', () => this)

  private overlayId: number | null = null

  protected override render() {
    const text =
      this.selectedChainIdList.length > 1
        ? this.selectedChainIdList.length === chainList.length
          ? 'All Networks'
          : 'Some Networks'
        : this.defaultChainView.name
    return html`
      <inch-button @click="${() => this.onClick()}" size="l" type="tertiary-gray">
        <div class="icon-container">${this.getChainIcon()}</div>
        ${when(
          !this.mobileMedia.matches,
          () => html`
            <inch-text-animate text="${text}"></inch-text-animate>
            <inch-icon icon="chevronDown16"></inch-icon>
          `
        )}
      </inch-button>
    `
  }

  private async onClick() {
    if (this.overlay.isOpenOverlay(this.overlayId)) {
      await this.overlay.close(this.overlayId)
      this.overlayId = null
      return
    }

    this.overlayId = await this.overlay.open(
      html`
        <inch-chain-selector-list
          .selectedChainViewList="${this.getSelectedChainViewList()}"
          @changeSelectedChainViewList="${(event: CustomEvent) =>
            this.onChangeSelectedChainViewList(event.detail.value as ChainViewFull[])}"
        ></inch-chain-selector-list>
      `,
      { mode: OverlayViewMode.popupAuto }
    )
  }

  private updateChainIdList(chainViewList: ChainViewFull[]) {
    this.selectedChainIdList = chainViewList.map((item) => item.chainId)
  }

  private getSelectedChainViewList() {
    return chainList.filter((item: ChainViewFull) =>
      this.selectedChainIdList.includes(item.chainId)
    )
  }

  private getChainIcon() {
    const selectedChainViewList = this.getSelectedChainViewList()
    const positions = arrangeIcons(selectedChainViewList.length, 24)
    const selectedChainListSet = new Set(selectedChainViewList)
    let index = 0
    return html`
      ${map(chainList, (item) => {
        const hide = !selectedChainListSet.has(item)
        const position: { x: number; y: number; size: number } | undefined = positions[index]
        const size: number | undefined = position?.size
        const x: number | undefined = position?.x ?? 0
        const y: number | undefined = position?.y ?? 0
        if (!hide) {
          index++
        }
        const hideChainIcon = selectedChainViewList.length > 4
        const styleContainer: Record<string, string> = {
          transform: `translate3d(${x}px, ${y}px, 0)`,
          zIndex: index.toString(),
          opacity: hide ? '0' : '1',
          width: `${size}px`,
          height: `${size}px`,
          background: `linear-gradient(135deg, ${item.color.join(', ')})`,
        }
        const styleIcon: Record<string, string> = {
          opacity: hideChainIcon ? '0' : '1',
        }
        return html`
          <div id="${item.name}" class="icon-item-container" style="${styleMap(styleContainer)}">
            <inch-icon
              class="icon-item"
              style="${styleMap(styleIcon)}"
              width="${size}px"
              height="${size}px"
              icon="${item.iconName}"
            ></inch-icon>
          </div>
        `
      })}
    `
  }

  private onChangeSelectedChainViewList(chainList: ChainViewFull[]) {
    this.updateChainIdList(chainList)

    dispatchEvent(this, 'changeSelectedChainIdList', this.selectedChainIdList)
  }
}

function arrangeIcons(
  count: number,
  containerSize: number,
  border = 1
): { x: number; y: number; size: number }[] {
  const result: { x: number; y: number; size: number }[] = []

  if (count <= 0) return result

  if (count === 1) {
    const size = containerSize - border * 2
    return [{ x: border, y: border, size }]
  }

  if (count === 2) {
    const size = containerSize / 1.5 - border * 2
    return [
      { x: border, y: border, size },
      { x: containerSize - size - border, y: containerSize - size - border, size },
    ]
  }

  if (count === 3) {
    const size = containerSize / 1.8 - border * 2
    return [
      { x: (containerSize - size) / 2, y: border, size },
      { x: border, y: containerSize - size - border, size },
      { x: containerSize - size - border, y: containerSize - size - border, size },
    ]
  }

  if (count === 4) {
    const size = containerSize / 2 - border * 2
    return [
      { x: border, y: border, size },
      { x: containerSize - size - border, y: border, size },
      { x: border, y: containerSize - size - border, size },
      { x: containerSize - size - border, y: containerSize - size - border, size },
    ]
  }

  const sizeFactor = 2.5 + (count - 5) * 0.3
  const size = containerSize / sizeFactor - border * 2

  const angleStep = (2 * Math.PI) / count
  const radius = (containerSize - size) / 2 - border

  for (let i = 0; i < count; i++) {
    const angle = angleStep * i - Math.PI / 2
    const x = containerSize / 2 + radius * Math.cos(angle) - size / 2
    const y = containerSize / 2 + radius * Math.sin(angle) - size / 2
    result.push({ x, y, size })
  }

  return result
}

declare global {
  interface HTMLElementTagNameMap {
    [ChainSelectorElement.tagName]: ChainSelectorElement
  }
}
