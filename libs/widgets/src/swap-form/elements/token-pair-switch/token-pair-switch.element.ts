import {
  ApplicationContextToken,
  EmbeddedConfigToken,
} from '@1inch-community/core/application-context'
import {
  appendStyle,
  getMobileMatchMedia,
  observe,
  subscribe,
} from '@1inch-community/core/lit-utils'
import {
  EmbeddedBootstrapConfigSwapForm,
  IApplicationContext,
  ISwapContext,
} from '@1inch-community/models'
import { SwapContextToken } from '@1inch-community/sdk/swap'
import '@1inch-community/ui-components/icon'
import { consume } from '@lit/context'
import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import { createRef, ref } from 'lit/directives/ref.js'
import { combineLatest, defer, fromEvent, map, switchMap } from 'rxjs'
import { tokenPairSwitchStyle } from './token-pair-switch.style'

@customElement(TokenPairSwitchElement.tagName)
export class TokenPairSwitchElement extends LitElement {
  static tagName = 'inch-token-pair-switch' as const

  static override styles = tokenPairSwitchStyle

  @consume({ context: ApplicationContextToken })
  applicationContext!: IApplicationContext

  @consume({ context: SwapContextToken })
  swapContext?: ISwapContext

  @consume({ context: EmbeddedConfigToken })
  config?: EmbeddedBootstrapConfigSwapForm

  private readonly iconRef = createRef<HTMLElement>()
  private readonly buttonRef = createRef()
  private readonly mobileMedia = getMobileMatchMedia()

  private isUp = false

  private readonly isDisabled$ = defer(() => {
    if (!this.swapContext) throw new Error('')
    return combineLatest([
      this.swapContext.getTokenByType('source'),
      this.swapContext.getTokenByType('destination'),
    ])
  }).pipe(
    map(
      ([sourceToken, destinationToken]) =>
        !sourceToken || !destinationToken || this.config?.swapFromParams.disabledTokenChanging
    )
  )

  protected override firstUpdated() {
    if (!this.buttonRef.value) return
    if (this.config?.swapFromParams.disabledTokenChanging) return
    if (!this.mobileMedia.matches) {
      const options = {
        duration: 200,
        easing: 'cubic-bezier(.1, .3, .6, 1)',
      }
      subscribe(this, [
        fromEvent(this.buttonRef.value, 'mouseenter').pipe(
          switchMap(async () => {
            if (!this.iconRef.value || this.isUp) return
            this.isUp = true
            await this.applicationContext.animations.animate(
              this.iconRef.value,
              [{ transform: 'rotate(0deg)' }, { transform: 'rotate(180deg)' }],
              options
            )
            appendStyle(this.iconRef.value, {
              transform: 'rotate(180deg)',
            })
          })
        ),
        fromEvent(this.buttonRef.value, 'mouseleave').pipe(
          switchMap(async () => {
            if (!this.iconRef.value || !this.isUp) return
            this.isUp = false
            await this.applicationContext.animations.animate(
              this.iconRef.value,
              [{ transform: 'rotate(180deg)' }, { transform: 'rotate(360deg)' }],
              options
            )
            appendStyle(this.iconRef.value, {
              transform: '',
            })
          })
        ),
      ])
    }
  }

  protected override render() {
    return html`
      <button
        ${ref(this.buttonRef)}
        @click="${() => this.onClick()}"
        ?disabled="${observe(this.isDisabled$, false)}"
        class="switcher"
      >
        <inch-icon ${ref(this.iconRef)} class="switcher-icon" icon="arrowDown24"></inch-icon>
      </button>
    `
  }

  protected async onClick() {
    if (this.config?.swapFromParams.disabledTokenChanging) return
    if (!this.iconRef.value || (!this.isUp && !this.mobileMedia.matches)) return
    this.swapContext?.switchPair()
    const options = {
      duration: 200,
      easing: 'cubic-bezier(.1, .3, .6, 1)',
    }
    if (!this.mobileMedia.matches) {
      await this.iconRef.value.animate(
        [{ transform: 'rotate(180deg)' }, { transform: 'rotate(360deg)' }],
        options
      ).finished
      appendStyle(this.iconRef.value, {
        transform: '',
      })
      this.isUp = false
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inch-token-pair-switch': TokenPairSwitchElement
  }
}
