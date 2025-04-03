import { CacheActivePromise } from '@1inch-community/core/decorators'
import { dispatchEvent, getMobileMatchMediaAndSubscribe } from '@1inch-community/core/lit-utils'
import { ChainViewInfo } from '@1inch-community/models'
import { chainList } from '@1inch-community/sdk/chain'
import '@1inch-community/ui-components/button'
import '@1inch-community/ui-components/icon'
import { OverlayController } from '@1inch-community/ui-components/overlay'
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

  @property({ type: Array, attribute: false }) selectedChainList: ChainViewInfo[] = []

  private readonly mobileMedia = getMobileMatchMediaAndSubscribe(this)

  private readonly overlay = new OverlayController('#app-root', () => this)
  private overlayId: number | null = null

  constructor() {
    super()
    this.resetSelectedChainList()
  }

  protected override render() {
    return html`
      <inch-button class="button" @click="${() => this.onClick()}" size="l" type="primary-gray">
        <div class="icon-container">${this.getChainIcon()}</div>
        ${when(
          !this.mobileMedia.matches,
          () => html`
            <span
              >${this.selectedChainList.length > 1
                ? 'Cross-Chain'
                : this.selectedChainList[0].name}</span
            >
            <inch-icon icon="chevronDown16"></inch-icon>
          `
        )}
      </inch-button>
    `
  }

  @CacheActivePromise()
  private async onClick() {
    if (this.overlay.isPopupOpen(this.overlayId ?? 0)) {
      this.closePopup()
      return
    }
    this.overlayId = await this.overlay.openPopup(html`
      <inch-chain-selector-list
        .selectedChainList="${this.selectedChainList}"
        @changeSelectedChainList="${(event: CustomEvent) =>
          this.onChangeSelectedChainList(event.detail.value as ChainViewInfo[])}"
      ></inch-chain-selector-list>
    `)
  }

  private resetSelectedChainList() {
    this.selectedChainList = [chainList[0]]
  }

  private getChainIcon() {
    const positions = arrangeIcons(this.selectedChainList.length, 24)
    return html`
      ${map(this.selectedChainList, (item, index) => {
        const size = positions[index].size
        let style: Record<string, string> = {
          transform: `translate(${positions[index].x}px, ${positions[index].y}px)`,
          zIndex: index.toString(),
        }
        if (this.selectedChainList.length > 4) {
          style = {
            ...style,
            width: `${size}px`,
            height: `${size}px`,
            background: `linear-gradient(135deg, ${item.color.join(', ')})`,
          }
          return html` <div class="icon-common" style="${styleMap(style)}"></div> `
        }
        return html`
          <inch-icon
            style="${styleMap(style)}"
            width="${size}px"
            height="${size}px"
            class="icon-common"
            icon="${item.iconName}"
          ></inch-icon>
        `
      })}
    `
  }

  private closePopup() {
    if (!this.overlayId) return
    this.overlay.closePopup(this.overlayId)
    this.overlayId = null
  }

  private onChangeSelectedChainList(chainList: ChainViewInfo[]) {
    this.selectedChainList = chainList
    dispatchEvent(this, 'changeSelectedChainList', this.selectedChainList)
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
