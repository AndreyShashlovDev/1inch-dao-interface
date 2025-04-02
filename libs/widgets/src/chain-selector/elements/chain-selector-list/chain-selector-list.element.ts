import {
  dispatchEvent,
  getMobileMatchMediaAndSubscribe,
} from '@1inch-community/core/lit-utils'
import { chainList } from '@1inch-community/sdk/chain'
import '@1inch-community/ui-components/button'
import '@1inch-community/ui-components/card'
import '@1inch-community/ui-components/scroll'
import { html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { ChainViewInfo } from '../../models'
import '../chain-selector-list-item'
import { chainSelectorListStyle } from './chain-selector-list.style'

@customElement(ChainSelectorListElement.tagName)
export class ChainSelectorListElement extends LitElement {
  static tagName = 'inch-chain-selector-list' as const

  static override styles = [chainSelectorListStyle]

  @property({ type: Array, attribute: false }) selectedChainList: ChainViewInfo[] = []

  private readonly mobileMedia = getMobileMatchMediaAndSubscribe(this)

  protected override render() {
    return this.mobileMedia.matches ? this.getMobileList() : this.getDesktopList()
  }

  private getList() {
    return chainList.map(
      (info) => html`
        <inch-chain-selector-list-item
          .info="${info}"
          .selectedChainList="${this.selectedChainList}"
          .isActiveChain="${this.selectedChainList.includes(info)}"
          @chainItemClick="${(event: CustomEvent) =>
            this.onChainItemClick(event.detail.value as ChainViewInfo)}"
        ></inch-chain-selector-list-item>
      `
    )
  }

  private getMobileList() {
    return html`
      <inch-card class="card" forMobileView>
        <inch-card-header closeButton headerText="Select chain"></inch-card-header>
        <inch-scroll-view-consumer> ${this.getList()} </inch-scroll-view-consumer>
      </inch-card>
    `
  }

  private getDesktopList() {
    return html`
      <inch-card class="card">
        <header class="header">
          <h2 class="title">Networks</h2>
          <inch-button size="xl" type="link" @click="${this.onSelectAllClick}"
            >${this.selectedChainList.length === chainList.length
              ? 'Deselect All'
              : 'Select All'}</inch-button
          >
        </header>
        ${this.getList()}
      </inch-card>
    `
  }

  private resetSelectedChainList() {
    this.selectedChainList = [chainList[0]]
  }

  private onSelectAllClick(): void {
    if (this.selectedChainList.length === chainList.length) {
      this.resetSelectedChainList()
    } else {
      this.selectedChainList = chainList
    }

    dispatchEvent(this, 'changeSelectedChainList', this.selectedChainList)
  }

  private onChainItemClick(chainInfo: ChainViewInfo) {
    if (this.selectedChainList.includes(chainInfo)) {
      this.selectedChainList = this.selectedChainList.filter((item) => item !== chainInfo)
    } else {
      this.selectedChainList = [...this.selectedChainList, chainInfo]
    }

    if (this.selectedChainList.length === 0) {
      this.resetSelectedChainList();
    }

    dispatchEvent(this, 'changeSelectedChainList', this.selectedChainList)
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inch-chain-selector-list': ChainSelectorListElement
  }
}
