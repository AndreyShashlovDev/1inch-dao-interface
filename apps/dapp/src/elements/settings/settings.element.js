import { ApplicationContextToken } from '@1inch-community/core/application-context'
import { getMobileMatchMediaAndSubscribe } from '@1inch-community/core/lit-utils'
import { Locale } from '@1inch-community/models'
import { SceneController, shiftAnimation } from '@1inch-community/ui-components/scene'
import { consume } from '@lit/context'
import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import { __decorate, __metadata } from 'tslib'
import { settingsStyle } from './settings.style'
import {
  getLocalizationSettingsView,
  getMainSettingsView,
  getPersonalizationSettingsView,
} from './settings.view'
const localeCount = Object.keys(Locale).length
const localizationHeight = 44 + 8 + localeCount * 64
let Settings = class Settings extends LitElement {
  constructor() {
    super(...arguments)
    this.mobileMedia = getMobileMatchMediaAndSubscribe(this)
    this.scene = new SceneController(
      'main',
      {
        main: {
          minWidth: this.getWidth(),
          maxWidth: this.getWidth(),
          maxHeight: 180,
          minHeight: 180,
        },
        personalization: {
          minWidth: this.getWidth(),
          maxWidth: this.getWidth(),
          maxHeight: 240,
          minHeight: 240,
        },
        localization: {
          minWidth: this.getWidth(),
          maxWidth: this.getWidth(),
          maxHeight: localizationHeight,
          minHeight: localizationHeight,
        },
      },
      shiftAnimation()
    )
  }
  static {
    this.tagName = 'inch-settings'
  }
  static {
    this.styles = settingsStyle
  }
  render() {
    return html`
      <div class="settings-scene-container">
        ${this.scene.render({
          main: () => getMainSettingsView(this.scene, this),
          personalization: () =>
            getPersonalizationSettingsView(this.scene, this.applicationContext, this),
          localization: () => getLocalizationSettingsView(this.scene, this.applicationContext),
        })}
      </div>
    `
  }
  getWidth() {
    if (this.mobileMedia.matches) return window.innerWidth - 16
    return 556
  }
}
__decorate(
  [consume({ context: ApplicationContextToken }), __metadata('design:type', Object)],
  Settings.prototype,
  'applicationContext',
  void 0
)
Settings = __decorate([customElement(Settings.tagName)], Settings)
export { Settings }
//# sourceMappingURL=settings.element.js.map
