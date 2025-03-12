import { ApplicationContextToken } from '@1inch-community/core/application-context'
import { formatHex } from '@1inch-community/core/formatters'
import { observe } from '@1inch-community/core/lit-utils'
import { ChainId, IApplicationContext } from '@1inch-community/models'
import '@1inch-community/ui-components/icon'
import { consume } from '@lit/context'
import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import { defer, map, Observable } from 'rxjs'
import { notificationsMobileInfoStyle } from './notifications-mobile-info.style'

const chainIdIcons: Record<ChainId, string> = {
  [ChainId.eth]: 'eth24',
  [ChainId.bnb]: 'bnb24',
  [ChainId.matic]: 'matic24',
  [ChainId.op]: 'op24',
  [ChainId.arbitrum]: 'arbitrum24',
  [ChainId.gnosis]: 'gnosis24',
  [ChainId.avalanche]: 'avalanche24',
  [ChainId.fantom]: 'fantom24',
  [ChainId.aurora]: 'aurora24',
  [ChainId.klaytn]: 'klaytn24',
  [ChainId.zkSyncEra]: 'zkSyncEra24',
}

@customElement(NotificationsMobileInfoElement.tagName)
export class NotificationsMobileInfoElement extends LitElement {
  static readonly tagName = 'inch-notifications-mobile-info' as const

  static override styles = notificationsMobileInfoStyle

  @consume({ context: ApplicationContextToken })
  applicationContext!: IApplicationContext

  private readonly addressView$: Observable<string> = defer(
    () => this.applicationContext.wallet.data.activeAddress$
  ).pipe(
    map((address) => {
      if (!address) return ''
      const width = Math.max(Math.round(window.innerWidth / 25), 12)
      const head = Math.round(width / 2)
      const tail = width - head
      return formatHex(address, { width, head, tail })
    })
  )

  private readonly chainIdIconName$: Observable<string> = defer(
    () => this.applicationContext.wallet.data.chainId$
  ).pipe(
    map((chainId) => {
      if (!chainId) return ''
      return chainIdIcons[chainId]
    })
  )

  protected render() {
    return html`
      <div class="grid-container">
        <inch-icon icon="logoFull"></inch-icon>
        <div class="address">
          <span>${observe(this.addressView$)}</span>
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inch-notifications-mobile-info': NotificationsMobileInfoElement
  }
}
