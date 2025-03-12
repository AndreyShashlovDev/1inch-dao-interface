import { ApplicationContextToken } from '@1inch-community/core/application-context'
import { asyncTimeout } from '@1inch-community/core/async'
import { scrollbarStyle } from '@1inch-community/core/theme'
import { IApplicationContext } from '@1inch-community/models'
import '@1inch-community/widgets/notifications'
import { consume } from '@lit/context'
import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import { appStyle } from './app.style'
import './elements/footer'
import './elements/header'
import './elements/swap-form'

@customElement('app-root')
export class AppElement extends LitElement {
  static override styles = [appStyle, scrollbarStyle]

  @consume({ context: ApplicationContextToken })
  applicationContext!: IApplicationContext

  protected firstUpdated() {
    // this.init()
  }

  private async init() {
    const notifications = this.applicationContext.notifications
    let i = 0
    await notifications.show(
      'Swap status',
      html`<inch-notification-fusion-swap-view
        orderHash="0xd88ff7eb802ef939e3652006777f6fbe70955d094c3ff97799472070f33796fb"
      ></inch-notification-fusion-swap-view>`
    )
    const loop = async () => {
      if (i >= 1) return
      await notifications.warning('test notification ' + i)
      i++
      await asyncTimeout(2000)
      loop()
    }
    await loop()
  }

  protected render() {
    return html`
      <inch-header></inch-header>
      <div id="outlet" class="content">
        <inch-swap-form-container></inch-swap-form-container>
      </div>
      <inch-footer></inch-footer>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-root': AppElement
  }
}
