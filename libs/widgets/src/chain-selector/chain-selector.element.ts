import { CacheActivePromise } from '@1inch-community/core/decorators'
import { getMobileMatchMediaAndSubscribe, observe } from '@1inch-community/core/lit-utils'
import { IWallet } from '@1inch-community/models'
import { chainList } from '@1inch-community/sdk/chain'
import '@1inch-community/ui-components/button'
import '@1inch-community/ui-components/icon'
import { OverlayController } from '@1inch-community/ui-components/overlay'
import { html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'
import { defer, filter, map } from 'rxjs'
import { chainViewConfig } from '../wallet-manage/chain-view-config'
import { chainSelectorStyle } from './chain-selector.style'
import './elements/chain-selector-list'
import { ChainViewInfo } from './models'

@customElement(ChainSelectorElement.tagName)
export class ChainSelectorElement extends LitElement {
  static tagName = 'inch-chain-selector' as const

  static override styles = chainSelectorStyle

  @property({ type: Object, attribute: false })
  controller?: IWallet

  @state() selectedChainList: ChainViewInfo[] = []

  private readonly mobileMedia = getMobileMatchMediaAndSubscribe(this)

  private readonly overlay = new OverlayController('#app-root', () => this)
  private overlayId: number | null = null

  private readonly chainId$ = defer(() => this.getController().data.chainId$)
  private readonly unsupportedChainId$ = this.chainId$.pipe(
    map((chainId) => (!!chainId && !!chainViewConfig[chainId] ? '' : 'unsupported'))
  )
  private readonly chainIdIconName$ = this.chainId$.pipe(
    filter(Boolean),
    map((chainId) => {
      if (!chainViewConfig[chainId]) return 'alert24'
      return chainViewConfig[chainId].iconName
    })
  )
  private readonly chainIdName$ = this.chainId$.pipe(
    filter(Boolean),
    map((chainId) => {
      if (!chainViewConfig[chainId]) return 'Unsupported chain'
      return chainViewConfig[chainId].name
    })
  )

  constructor() {
    super()
    this.resetSelectedChainList()
  }

  protected override render() {
    return html`
      <inch-button class="button" @click="${() => this.onClick()}" size="l" type="primary-gray">
        <div
          class="capacity-${this.selectedChainList.length > 6
            ? 6
            : this.selectedChainList.length} icon-container"
        >
          ${this.getChainIcon()}
        </div>
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
        .controller="${this.controller}"
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
    if (this.selectedChainList.length >= 6) {
      return html`
        ${this.selectedChainList
          .slice(0, 6)
          .map(
            (item, i) =>
              html`<inch-icon
                width="6px"
                height="6px"
                class="${observe(this.unsupportedChainId$)} icon-${i} icon-common"
                icon="${item.iconName}"
              ></inch-icon>`
          )}
      `
    }

    switch (this.selectedChainList.length) {
      case 1:
        return html`<inch-icon
          class="${observe(this.unsupportedChainId$)}"
          icon="${this.selectedChainList[0].iconName}"
        ></inch-icon>`
      case 2:
        return html`
          <div class="icon-container capacity-2">
            ${this.selectedChainList.map(
              (item, i) =>
                html`<inch-icon
                  width="16px"
                  height="16px"
                  class="${observe(this.unsupportedChainId$)} icon-${i} icon-common"
                  icon="${item.iconName}"
                ></inch-icon>`
            )}
          </div>
        `
      case 3:
        return html`
          ${this.selectedChainList.map(
            (item, i) =>
              html`<inch-icon
                width="12px"
                height="12px"
                class="${observe(this.unsupportedChainId$)} icon-${i} icon-common"
                icon="${item.iconName}"
              ></inch-icon>`
          )}
        `
      case 4:
        return html`
          ${this.selectedChainList.map(
            (item, i) =>
              html`<inch-icon
                width="12px"
                height="12px"
                class="${observe(this.unsupportedChainId$)} icon-${i} icon-common"
                icon="${item.iconName}"
              ></inch-icon>`
          )}
        `
      case 5:
        return html`
          ${this.selectedChainList.map(
            (item, i) =>
              html`<inch-icon
                width="6px"
                height="6px"
                class="${observe(this.unsupportedChainId$)} icon-${i} icon-common"
                icon="${item.iconName}"
              ></inch-icon>`
          )}
        `
      default:
        return html`<inch-icon
          class="${observe(this.unsupportedChainId$)}"
          icon="${observe(this.chainIdIconName$)}"
        ></inch-icon>`
    }
  }

  private closePopup() {
    if (!this.overlayId) return
    this.overlay.closePopup(this.overlayId)
    this.overlayId = null
  }

  private getController() {
    if (!this.controller) {
      throw new Error('')
    }
    return this.controller
  }

  private onChangeSelectedChainList(chainList: ChainViewInfo[]) {
    this.selectedChainList = chainList
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inch-chain-selector': ChainSelectorElement
  }
}
