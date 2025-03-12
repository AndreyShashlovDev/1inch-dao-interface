import { ApplicationContextToken } from '@1inch-community/core/application-context'
import { asyncTimeout } from '@1inch-community/core/async'
import { scrollbarStyle } from '@1inch-community/core/theme'
import '@1inch-community/widgets/notifications'
import { consume } from '@lit/context'
import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import { __decorate, __metadata } from 'tslib'
import { appStyle } from './app.style'
import './elements/footer'
import './elements/header'
import './elements/swap-form'
let AppElement = class AppElement extends LitElement {
  static {
    this.styles = [appStyle, scrollbarStyle]
  }
  firstUpdated() {
    // this.init()
  }
  async init() {
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
  render() {
    return html`
      <inch-header></inch-header>
      <div id="outlet" class="content">
        <inch-swap-form-container></inch-swap-form-container>
      </div>
      <inch-footer></inch-footer>
    `
  }
}
__decorate(
  [consume({ context: ApplicationContextToken }), __metadata('design:type', Object)],
  AppElement.prototype,
  'applicationContext',
  void 0
)
AppElement = __decorate([customElement('app-root')], AppElement)
export { AppElement }
//# sourceMappingURL=app.element.js.map
