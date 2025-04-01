import { IApplicationContext, ITurnstileController } from '@1inch-community/models'
import { firstValueFrom, Subject } from 'rxjs'
import { appendStyle } from '../lit-utils'
import { lazyAppContext } from '../utils'

const CALLBACK_NAME = '__turnstile_callback__'

export interface TurnstileOptions {
  sitekey: string
  action?: string
  cData?: string
  callback?: (token: string) => void
  retry?: string
  theme?: 'light' | 'dark' | 'auto'
  tabindex?: number
  'refresh-expired'?: 'auto' | 'manual' | 'never'
  'retry-interval'?: string
  'error-callback'?: (err: string) => void
  'expired-callback'?: () => void
  'before-interactive-callback'?: () => void
  'after-interactive-callback'?: () => void
}

declare global {
  interface Window {
    [CALLBACK_NAME]: () => void
    turnstile?: {
      render: (idOrContainer: string | HTMLElement, options: TurnstileOptions) => string
      reset: (widgetIdOrContainer: string | HTMLElement) => void
      getResponse: (widgetIdOrContainer: string | HTMLElement) => string | undefined
      remove: (widgetIdOrContainer: string | HTMLElement) => void
    }
  }
}

const TurnstileRetry: string[] = [
  'crashed',
  'undefined_error',
  'challenge_failed',
  '102',
  '103',
  '104',
  '110600',
  '300100',
  '600',
]

const MAX_RETRY_COUNT = 4

export class TurnstileController implements ITurnstileController {
  private readonly complete$ = new Subject<void>()
  private readonly context = lazyAppContext('TurnstileController')
  private element: HTMLDivElement | null = null
  private siteKey: string | null = null
  private token: string | null = null
  private retryCounter = 0
  private verificationInProgress = false
  private isInitScript = false

  async init(context: IApplicationContext): Promise<void> {
    this.context.set(context)
    this.siteKey = this.context.value.environment.get('cloudflareTurnstileSiteKey') ?? null
    if (!this.siteKey) throw new Error('TurnstileController.init Error: siteKey is not defined')
    this.initScript()
  }

  getToken(): string | null {
    const token = this.token
    this.token = null
    return token
  }

  getVerificationInProgress(): boolean {
    return this.verificationInProgress
  }

  turnstileComplete(): Promise<void> {
    return firstValueFrom(this.complete$)
  }

  startTurnstile() {
    if (this.verificationInProgress || !this.isInitScript) return
    this.clean()
    this.render()
  }

  private initScript() {
    if (this.isInitScript) return
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.async = true
    script.defer = true
    script.src = `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=${CALLBACK_NAME}`

    Reflect.set(window, CALLBACK_NAME, () => {
      this.isInitScript = true
      this.render()
    })

    document.head.appendChild(script)
  }

  private render() {
    if (!this.siteKey || !window.turnstile) return
    this.verificationInProgress = true
    this.element = document.createElement('div')
    appendStyle(this.element, {
      position: 'absolute',
      zIndex: '-1',
      top: '-1000px',
      left: '-1000px',
    })
    document.body.appendChild(this.element)
    window.turnstile.render(this.element, {
      sitekey: this.siteKey,
      callback: (token) => this.setToken(token),
      'error-callback': (err) => this.handleError(`${err}`),
    })
  }

  private setToken(token: string) {
    this.token = token
    this.clean()
    this.retryCounter = 0
    this.verificationInProgress = false
    this.complete$.next()
  }

  private clean() {
    if (!this.element || !this.element.parentElement) return
    window.turnstile?.remove(this.element)
    document.body.removeChild(this.element)
    this.element = null
  }

  private handleError(err: string) {
    console.warn('Turnstile render error', err)
    if (
      this.retryCounter < MAX_RETRY_COUNT &&
      TurnstileRetry.find((code) => err.startsWith(code))
    ) {
      this.retry()
    } else {
      this.clean()
    }
    this.verificationInProgress = false
  }

  private retry() {
    console.warn('Turnstile retry')
    this.retryCounter++
    this.clean()
    this.render()
  }
}
