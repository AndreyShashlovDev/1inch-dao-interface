import { throttle } from '@1inch-community/core/decorators'
import { formatHex } from '@1inch-community/core/formatters'
import { lazyAppContextConsumer, lazyConsumer } from '@1inch-community/core/lazy'
import { dispatchEvent, subscribe, translate } from '@1inch-community/core/lit-utils'
import {
  ChainId,
  EIP6963ProviderInfo,
  IWalletAccountContext,
  OverlayViewMode,
} from '@1inch-community/models'
import '@1inch-community/ui-components/button'
import '@1inch-community/ui-components/icon'
import { scrollContext } from '@1inch-community/ui-components/scroll'
import { consume } from '@lit/context'
import { html, LitElement } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'
import { combineLatest, distinctUntilChanged, filter, tap } from 'rxjs'
import { Address } from 'viem'
import '../../../elements/wallet-view-address-balance'
import { walletAccountContext } from '../../context'
import '../../i18n'
import '../wallet-account-card-account-more'
import { MenuItem } from '../wallet-account-card-account-more'
import { walletAccountCardStyle } from './wallet-account-card.style'

enum MenuItemIds {
  CopyAddress,
  ExternalView,
  Switch,
  Disconnect,
}

@customElement(WalletAccountCardElement.tagName)
export class WalletAccountCardElement extends LitElement {
  static readonly tagName = 'inch-wallet-account-card' as const

  static override styles = [walletAccountCardStyle]

  private readonly applicationContext = lazyAppContextConsumer(this)

  @consume({ context: walletAccountContext })
  context?: IWalletAccountContext

  @state()
  private walletAddress?: Address

  @state()
  private walletInfo?: EIP6963ProviderInfo

  @state()
  private chainId?: ChainId

  @state()
  private isCollapsed = false

  private overlayId: number | null = null

  private readonly menuItems: MenuItem[] = [
    {
      text: 'widgets.wallet-account-view.card.more.copy',
      style: 'standard',
      icon: 'copy16',
      id: MenuItemIds.CopyAddress,
    },
    {
      text: 'widgets.wallet-account-view.card.more.view',
      style: 'standard',
      icon: 'externalLink16',
      id: MenuItemIds.ExternalView,
    },
    {
      text: 'widgets.wallet-account-view.card.more.switch',
      style: 'standard',
      icon: 'swap24',
      id: MenuItemIds.Switch,
    },
    {
      text: 'widgets.wallet-account-view.card.more.disconnect',
      style: 'dangerous',
      icon: 'logout16',
      id: MenuItemIds.Disconnect,
    },
  ]

  private readonly scrollConsumer = lazyConsumer(this, { context: scrollContext })

  protected override firstUpdated() {
    if (!this.context) {
      throw new Error('setup context before')
    }

    const collapseThreshold = 100

    subscribe(
      this,
      this.scrollConsumer.value.scrollTopFromConsumer$.pipe(
        tap((value) => {
          this.isCollapsed = value > collapseThreshold

          if (this.isCollapsed) {
            this.closeMenuMore()
          }
        })
      )
    )

    subscribe(
      this,
      [
        combineLatest([
          this.context.connectedWalletAddress$,
          this.context.connectedWalletInfo$,
          this.context.chainId$,
        ]).pipe(
          distinctUntilChanged(),
          filter(
            ([address, info, chainId]) => address !== null && info !== null && chainId !== null
          ),
          tap(([address, info, chainId]) => {
            this.walletAddress = address!
            this.walletInfo = info!
            this.chainId = chainId!
          })
        ),
      ],
      { requestUpdate: false }
    )
  }

  private onChangeWalletClick() {
    dispatchEvent(this, 'changeWalletClick', undefined)
  }

  @throttle(500)
  private onMenuItemClick(id: number) {
    if (!this.context || !this.walletAddress || !this.chainId) {
      return
    }

    if (this.overlayId) {
      this.applicationContext.value.overlay.close(this.overlayId).catch((e) => console.warn(e))
    }

    switch (id) {
      case MenuItemIds.CopyAddress:
        this.context.copyAddress(this.walletAddress)
        break
      case MenuItemIds.ExternalView:
        this.context.openExplorer(this.chainId, this.walletAddress)
        break
      case MenuItemIds.Switch:
        this.onChangeWalletClick()
        break
      case MenuItemIds.Disconnect:
        this.context.disconnectWallet()
        break
    }
  }

  @throttle(300)
  private async onMoreClick(target: HTMLElement) {
    if (this.applicationContext.value.overlay.isOpenOverlay(this.overlayId)) {
      await this.closeMenuMore()
      return
    }

    this.overlayId = await this.applicationContext.value.overlay.open(
      html`
        <inch-wallet-account-card-more
          .items="${this.menuItems}"
          @menuMoreItemClick="${(e: CustomEvent) => this.onMenuItemClick(e.detail.value)}"
        ></inch-wallet-account-card-more>
      `,
      {
        mode: OverlayViewMode.popupAuto,
        targetFactory: () => target,
      }
    )
  }

  private async closeMenuMore() {
    if (this.overlayId) {
      await this.applicationContext.value.overlay.close(this.overlayId)
      this.overlayId = null
    }
  }

  protected override render() {
    const address = this.walletAddress
    const icon = this.walletInfo?.icon
    const name = this.walletInfo?.name
    const hasData = address && icon && name

    return html`
      <div class="card ${this.isCollapsed ? 'collapsed' : ''}" ">
        <inch-icon
            class="background-unicorn ${this.isCollapsed ? 'collapsed' : ''}"
            icon="unicornBackground"
        ></inch-icon>

        <div class="card-wallet-container ${this.isCollapsed ? 'fade-out' : ''}">
          <div class="card-wallet ${hasData ? '' : 'loader'} ${this.isCollapsed ? 'fade-out' : ''}">
            ${when(
              hasData,
              () => html`
                <div class="card-wallet-icon">
                  <img class="wallet-icon" alt="${name}" src="${icon}" />
                </div>
                <div class="card-wallet-address">${formatHex(address!)}</div>

                <inch-button @click="${() => this.onChangeWalletClick()}" type="tertiary" size="xs">
                  <inch-icon class="card-item__color" icon="swap24"></inch-icon>
                </inch-button>
              `
            )}
          </div>

          <inch-button
            @click="${(e: MouseEvent) => this.onMoreClick(e.target as HTMLElement)}"
            type="tertiary"
            size="xs"
          >
            <inch-icon class="card-item__color" icon="more24"></inch-icon>
          </inch-button>
        </div>
        <div>
          <inch-wallet-view-address-balance
            class="card-wallet-balance"
            .address="${this.walletAddress}"
          ></inch-wallet-view-address-balance>
        </div>

        <div class="card-actions ${this.isCollapsed ? 'fade-out' : ''}">
          <inch-button @click="${() => {}}" type="tertiary" fullSize="${true}" size="l">
            <inch-icon class="btn-send-icon-arrow" icon="arrowLeft24"></inch-icon>
            <span class="card-item__color">
              ${translate(`widgets.wallet-account-view.card.send`)}
            </span>
          </inch-button>

          <inch-button @click="${() => {}}" type="tertiary" fullSize="${true}" size="l">
            <inch-icon class="btn-receive-icon-arrow" icon="arrowLeft24"></inch-icon>
            <span class="card-item__color">
              ${translate(`widgets.wallet-account-view.card.receive`)}
            </span>
          </inch-button>
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inch-wallet-account-card': WalletAccountCardElement
  }
}
