import { html, LitElement, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { IWallet } from '@1inch-community/models'
import '@1inch-community/ui-components/button';
import '@1inch-community/ui-components/icon';
import { observe, getMobileMatchMediaAndSubscribe } from '@1inch-community/core/lit-utils';
import { chainSelectorStyle } from './chain-selector.style';
import { defer, filter, map } from 'rxjs';
import { when } from 'lit/directives/when.js';
import { OverlayController } from '@1inch-community/ui-components/overlay';
import { chainList, chainViewConfig } from './chain-view-config';
import './elements/chain-selector-list'
import { CacheActivePromise } from '@1inch-community/core/decorators';
import { ChainViewInfo } from './models';
import { createRef, ref } from 'lit/directives/ref.js';


@customElement(ChainSelectorElement.tagName)
export class ChainSelectorElement extends LitElement {
  static tagName = 'inch-chain-selector' as const;

  static override styles = chainSelectorStyle;

  private refContainer = createRef<HTMLDivElement>()

  @property({ type: Object, attribute: false })
  controller?: IWallet;

  @state() selectedChainList: ChainViewInfo[] = [];

  private readonly mobileMedia = getMobileMatchMediaAndSubscribe(this);

  private readonly overlay = new OverlayController('#app-root', () => this)
  private overlayId: number | null = null;

  private readonly chainId$ = defer(() => this.getController().data.chainId$);
  private readonly unsupportedChainId$ = this.chainId$.pipe(
    map((chainId) =>
      !!chainId && !!chainViewConfig[chainId] ? '' : 'unsupported',
    ),
  );
  private readonly chainIdIconName$ = this.chainId$.pipe(
    filter(Boolean),
    map((chainId) => {
      if (!chainViewConfig[chainId]) return 'alert24';
      return chainViewConfig[chainId].iconName;
    }),
  );
  private readonly chainIdName$ = this.chainId$.pipe(
    filter(Boolean),
    map((chainId) => {
      if (!chainViewConfig[chainId]) return 'Unsupported chain';
      return chainViewConfig[chainId].name;
    }),
  );

  constructor() {
    super();
    this.resetSelectedChainList();
  }

  protected override render() {
    return html`
      <inch-button class="button" @click="${() => this.onClick()}" size="l" type="primary-gray">
        <div ${ref(this.refContainer)} class="capacity-${this.selectedChainList.length > 6 ? 6 : this.selectedChainList.length} icon-container">
          ${this.getChainIcon()}
        </div>
        ${when(!this.mobileMedia.matches, () => html`
          <span>${this.selectedChainList.length > 1 ? 'Cross-Chain' : this.selectedChainList[0].name}</span>
          <inch-icon icon="chevronDown16"></inch-icon>
        `)}
      </inch-button>
    `;
  }

  protected updated(_changedProperties: PropertyValues) {
    super.updated(_changedProperties);
    console.log(_changedProperties)
    console.log(this.refContainer.value)
    setTimeout(() => {
      this.refContainer.value?.classList.add('test')
    }, 10000)
  }

  @CacheActivePromise()
  private async onClick() {
    if (this.overlay.isPopupOpen(this.overlayId ?? 0)) {
      this.closeOverlay();
      return;
    }
    this.overlayId = await this.overlay.openPopup(html`
      <inch-chain-selector-list
        .controller="${this.controller}"
        .selectedChainList="${this.selectedChainList}"
        @changeSelectedChainList="${(event: CustomEvent) =>
          this.onChangeSelectedChainList(
            event.detail.value as ChainViewInfo[],
          )}"
      ></inch-chain-selector-list>
    `);
  }

  private resetSelectedChainList() {
    /**
     * TODO: Определиться с дефолтом?
     */
    this.selectedChainList = [chainList[0]];
  }

  /**
   * TODO: Отказаться от ререндера, а просто инжектить новые значки в какой-то контейнер, не удаляя старые
   */
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
                  class="${observe(
                this.unsupportedChainId$,
              )} icon-${i} icon-common"
                  icon="${item.iconName}"
                ></inch-icon>`,
          )}
      `;
    }

    switch (this.selectedChainList.length) {
      case 1:
        return html`<inch-icon
          class="${observe(this.unsupportedChainId$)}"
          icon="${this.selectedChainList[0].iconName}"
        ></inch-icon>`;
      case 2:
        return html`
          <div class="icon-container capacity-2">
            ${this.selectedChainList.map(
              (item, i) =>
                html`<inch-icon
                  width="16px"
                  height="16px"
                  class="${observe(
                    this.unsupportedChainId$,
                  )} icon-${i} icon-common"
                  icon="${item.iconName}"
                ></inch-icon>`,
            )}
          </div>
        `;
      case 3:
        return html`
          ${this.selectedChainList.map(
            (item, i) =>
              html`<inch-icon
                  width="12px"
                  height="12px"
                  class="${observe(
                this.unsupportedChainId$,
              )} icon-${i} icon-common"
                  icon="${item.iconName}"
                ></inch-icon>`,
          )}
        `;
      case 4:
        return html`
          ${this.selectedChainList.map(
            (item, i) =>
              html`<inch-icon
                  width="12px"
                  height="12px"
                  class="${observe(
                this.unsupportedChainId$,
              )} icon-${i} icon-common"
                  icon="${item.iconName}"
                ></inch-icon>`,
          )}
        `;
      case 5:
        return html`
          ${this.selectedChainList.map(
            (item, i) =>
              html`<inch-icon
                  width="6px"
                  height="6px"
                  class="${observe(
                this.unsupportedChainId$,
              )} icon-${i} icon-common"
                  icon="${item.iconName}"
                ></inch-icon>`,
          )}
        `;
      default:
        return html`<inch-icon
          class="${observe(this.unsupportedChainId$)}"
          icon="${observe(this.chainIdIconName$)}"
        ></inch-icon>`;
    }
  }

  private closeOverlay() {
    if (!this.overlayId) return;
    this.overlay.closePopup(this.overlayId);
    this.overlayId = null;
  }

  private getController() {
    if (!this.controller) {
      throw new Error('');
    }
    return this.controller;
  }

  private onChangeSelectedChainList(chainList: ChainViewInfo[]) {
    if (chainList.length === 0) {
      return this.resetSelectedChainList();
    }

    this.selectedChainList = chainList;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inch-chain-selector': ChainSelectorElement;
  }
}
