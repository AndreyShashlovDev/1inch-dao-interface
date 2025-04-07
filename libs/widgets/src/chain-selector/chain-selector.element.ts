import { dispatchEvent } from '@1inch-community/core/lit-utils'
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
import { chainSelectorStyle } from './chain-selector.style'
import './elements/chain-selector-list'

const MAX_ICON_COUNT = 8

@customElement(ChainSelectorElement.tagName)
export class ChainSelectorElement extends LitElement {
  static tagName = 'inch-chain-selector' as const

  static override styles = chainSelectorStyle

  private defaultChainView: ChainViewFull = chainList[0]

  @property({ type: Array, attribute: false }) selectedChainIdList: ChainId[] = [
    this.defaultChainView.chainId,
  ]

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
        <inch-text-animate text="${text}"></inch-text-animate>
        <inch-icon icon="chevronDown16"></inch-icon>
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
    const positions = arrangeIcons(Math.min(selectedChainViewList.length, MAX_ICON_COUNT), 24)
    const selectedChainListSet = new Set(selectedChainViewList)
    let index = 0
    return html`
      ${map(chainList, (item) => {
        const hide = !selectedChainListSet.has(item) || !positions[index]
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

// function arrangeIcons(
//   count: number,
//   containerSize: number,
//   border = 1
// ): { x: number; y: number; size: number }[] {
//   const result: { x: number; y: number; size: number }[] = []
//   if (count <= 0) return result
//
//   // При каком количестве добавляем второй круг
//   const threshold = 9
//
//   const circles = count <= threshold ? [count] : [Math.ceil(count / 2), Math.floor(count / 2)]
//
//   let sizes: number[] = []
//   let radii: number[] = []
//
//   if (circles.length === 1) {
//     sizes = [containerSize / (2.5 + count * 0.1) - border * 2]
//     radii = [(containerSize - sizes[0]) / 2 - border]
//   } else {
//     sizes = [
//       containerSize / (3 + circles[0] * 0.1) - border * 2, // внешний круг чуть больше
//       containerSize / (3 + circles[1] * 0.1) - border * 2, // внутренний круг чуть меньше
//     ]
//     radii = [
//       (containerSize - sizes[0]) / 2 - border, // внешний радиус
//       (containerSize - sizes[0]) / 4 - border, // внутренний радиус, половина внешнего
//     ]
//   }
//
//   let iconIndex = 0
//
//   circles.forEach((circleCount, circleIndex) => {
//     const angleStep = (2 * Math.PI) / circleCount
//     const size = sizes[circleIndex]
//     const radius = radii[circleIndex]
//
//     for (let i = 0; i < circleCount; i++) {
//       if (iconIndex >= count) break
//       const angle = angleStep * i - Math.PI / 2
//       const x = containerSize / 2 + radius * Math.cos(angle) - size / 2
//       const y = containerSize / 2 + radius * Math.sin(angle) - size / 2
//       result.push({ x, y, size })
//       iconIndex++
//     }
//   })
//
//   return result
// }

// function arrangeIcons(
//   count: number,
//   containerSize: number,
//   border = 1
// ): { x: number; y: number; size: number }[] {
//   const result: { x: number; y: number; size: number }[] = []
//   if (count <= 0) return result
//
//   const maxOuterIcons = 8
//   const outerCount = count > maxOuterIcons ? maxOuterIcons : count
//   const innerCount = count - outerCount
//
//   const outerSize = containerSize / 3 - border * 2
//   const innerSize = containerSize / 4 - border * 2
//
//   const outerRadius = (containerSize - outerSize) / 2 - border
//   const innerRadius = outerRadius / 2
//
//   // Внешний круг
//   for (let i = 0; i < outerCount; i++) {
//     const angle = ((2 * Math.PI) / outerCount) * i - Math.PI / 2
//     const x = containerSize / 2 + outerRadius * Math.cos(angle) - outerSize / 2
//     const y = containerSize / 2 + outerRadius * Math.sin(angle) - outerSize / 2
//     result.push({ x, y, size: outerSize })
//   }
//
//   // Внутренний круг (если есть)
//   if (innerCount > 0) {
//     for (let i = 0; i < innerCount; i++) {
//       const angle = ((2 * Math.PI) / innerCount) * i - Math.PI / 2
//       const x = containerSize / 2 + innerRadius * Math.cos(angle) - innerSize / 2
//       const y = containerSize / 2 + innerRadius * Math.sin(angle) - innerSize / 2
//       result.push({ x, y, size: innerSize })
//     }
//   }
//
//   return result
// }

// function arrangeIcons(
//   count: number,
//   containerSize: number,
//   border = 1,
//   minIconSize = 5.5
// ): { x: number; y: number; size: number }[] {
//   const result: { x: number; y: number; size: number }[] = []
//
//   if (count <= 0) return result
//
//   if (count === 1) {
//     const size = containerSize - border * 2
//     return [{ x: border, y: border, size }]
//   }
//
//   if (count === 2) {
//     const size = containerSize / 1.5 - border * 2
//     return [
//       { x: border, y: border, size },
//       { x: containerSize - size - border, y: containerSize - size - border, size },
//     ]
//   }
//
//   if (count === 3) {
//     const size = containerSize / 1.8 - border * 2
//     return [
//       { x: (containerSize - size) / 2, y: border, size },
//       { x: border, y: containerSize - size - border, size },
//       { x: containerSize - size - border, y: containerSize - size - border, size },
//     ]
//   }
//
//   if (count === 4) {
//     const size = containerSize / 2 - border * 2
//     return [
//       { x: border, y: border, size },
//       { x: containerSize - size - border, y: border, size },
//       { x: border, y: containerSize - size - border, size },
//       { x: containerSize - size - border, y: containerSize - size - border, size },
//     ]
//   }
//
//   const size = containerSize / (2.5 + count * 0.1) - border * 2
//   debugger
//
//   if (size < minIconSize && count > 1) {
//     const outerCount = Math.ceil(count / 2)
//     const innerCount = count - outerCount
//
//     const outerSize = containerSize / 3 - border * 2
//     const innerSize = Math.max(outerSize * 0.7, minIconSize) - border * 2
//
//     const outerRadius = (containerSize - outerSize) / 2 - border
//     const innerRadius = outerRadius / 2 - border
//
//     for (let i = 0; i < outerCount; i++) {
//       const angle = ((2 * Math.PI) / outerCount) * i - Math.PI / 2
//       const x = containerSize / 2 + outerRadius * Math.cos(angle) - outerSize / 2
//       const y = containerSize / 2 + outerRadius * Math.sin(angle) - outerSize / 2
//       result.push({ x, y, size: outerSize })
//     }
//
//     for (let i = 0; i < innerCount; i++) {
//       const angle = ((2 * Math.PI) / innerCount) * i - Math.PI / 2
//       const x = containerSize / 2 + innerRadius * Math.cos(angle) - innerSize / 2
//       const y = containerSize / 2 + innerRadius * Math.sin(angle) - innerSize / 2
//       result.push({ x, y, size: innerSize })
//     }
//   } else {
//     const radius = (containerSize - size) / 2 - border
//     for (let i = 0; i < count; i++) {
//       const angle = ((2 * Math.PI) / count) * i - Math.PI / 2
//       const x = containerSize / 2 + radius * Math.cos(angle) - size / 2
//       const y = containerSize / 2 + radius * Math.sin(angle) - size / 2
//       result.push({ x, y, size })
//     }
//   }
//
//   return result
// }

declare global {
  interface HTMLElementTagNameMap {
    [ChainSelectorElement.tagName]: ChainSelectorElement
  }
}
