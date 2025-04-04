import { dispatchEvent, getMobileMatchMediaAndSubscribe } from '@1inch-community/core/lit-utils'
import { ChainViewFull } from '@1inch-community/models'
import { chainList } from '@1inch-community/sdk/chain'
import '@1inch-community/ui-components/button'
import '@1inch-community/ui-components/card'
import '@1inch-community/ui-components/scroll'
import { html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import '../chain-selector-list-item'
import { chainSelectorListStyle } from './chain-selector-list.style'

@customElement(ChainSelectorListElement.tagName)
export class ChainSelectorListElement extends LitElement {
  static tagName = 'inch-chain-selector-list' as const

  static override styles = [chainSelectorListStyle]

  @property({ type: Array, attribute: false }) selectedChainViewList: ChainViewFull[] = []

  private readonly mobileMedia = getMobileMatchMediaAndSubscribe(this)

  protected override render() {
    return this.mobileMedia.matches ? this.getMobileList() : this.getDesktopList()
  }

  private getList() {
    return chainList.map(
      (info) => html`
        <inch-chain-selector-list-item
          .info="${info}"
          .isActiveChain="${this.selectedChainViewList.includes(info)}"
          @chainItemClick="${(event: CustomEvent) =>
            this.onChainItemClick(event.detail.value as ChainViewFull)}"
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
            >${this.selectedChainViewList.length === chainList.length
              ? 'Deselect All'
              : 'Select All'}</inch-button
          >
        </header>
        ${this.getList()}
      </inch-card>
    `
  }

  private resetSelectedChainViewList() {
    this.selectedChainViewList = [chainList[0]]
  }

  private onSelectAllClick(): void {
    if (this.selectedChainViewList.length === chainList.length) {
      this.resetSelectedChainViewList()
    } else {
      this.selectedChainViewList = chainList
    }

    dispatchEvent(this, 'changeSelectedChainViewList', this.selectedChainViewList)
  }

  private onChainItemClick(chainInfo: ChainViewFull) {
    if (this.selectedChainViewList.includes(chainInfo)) {
      this.selectedChainViewList = this.selectedChainViewList.filter((item) => item !== chainInfo)
    } else {
      this.selectedChainViewList = [...this.selectedChainViewList, chainInfo]
    }

    if (this.selectedChainViewList.length === 0) {
      this.resetSelectedChainViewList()
    }

    dispatchEvent(this, 'changeSelectedChainViewList', this.selectedChainViewList)
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inch-chain-selector-list': ChainSelectorListElement
  }
}
