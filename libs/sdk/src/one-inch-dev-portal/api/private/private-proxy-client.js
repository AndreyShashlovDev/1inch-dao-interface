var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc)
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r
    return c > 3 && r && Object.defineProperty(target, key, r), r
  }
var __metadata =
  (this && this.__metadata) ||
  function (k, v) {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(k, v)
  }
import { CacheActivePromise } from '@1inch-community/core/decorators'
export class PrivateProxyClient {
  host
  token = null
  expirationTime = null
  context
  get isAuth() {
    return !!this.expirationTime && this.expirationTime > Date.now()
  }
  constructor(host) {
    this.host = host
  }
  async init(context) {
    this.context = context
    this.expirationTime =
      this.context.storage.get('private-proxy-client-expiration-time', Number) ?? null
    this.token = this.context.storage.get('private-proxy-client-token', String) ?? null
    this.auth().catch(console.error)
  }
  async get(url) {
    await this.auth()
    const response = await fetch(`${this.host}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
    })
    return await response.json()
  }
  async post(url, body) {
    await this.auth()
    const response = await fetch(`${this.host}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(body),
    })
    return await response.json()
  }
  async auth() {
    if (this.isAuth || !this.context) return
    let turnstileToken = this.context.turnstile.getToken()
    if (turnstileToken === null) {
      if (!this.context.turnstile.getVerificationInProgress()) {
        this.context.turnstile.startTurnstile()
      }
      await this.context.turnstile.turnstileComplete()
      turnstileToken = this.context.turnstile.getToken()
    }
    if (turnstileToken === null) return
    const response = await fetch(`${this.host}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: turnstileToken,
      }),
    })
    const { token, expiration_time } = await response.json()
    this.token = token
    this.expirationTime = expiration_time * 1000 - 2000
    this.context.storage.set('private-proxy-client-token', this.token)
    this.context.storage.set('private-proxy-client-expiration-time', this.expirationTime)
    console.log('auth complete')
  }
}
__decorate(
  [
    CacheActivePromise(),
    __metadata('design:type', Function),
    __metadata('design:paramtypes', []),
    __metadata('design:returntype', Promise),
  ],
  PrivateProxyClient.prototype,
  'auth',
  null
)
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJpdmF0ZS1wcm94eS1jbGllbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwcml2YXRlLXByb3h5LWNsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxrQ0FBa0MsQ0FBQTtBQVFyRSxNQUFNLE9BQU8sa0JBQWtCO0lBU0E7SUFSckIsS0FBSyxHQUFrQixJQUFJLENBQUE7SUFDM0IsY0FBYyxHQUFrQixJQUFJLENBQUE7SUFDcEMsT0FBTyxDQUFzQjtJQUVyQyxJQUFJLE1BQU07UUFDUixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxJQUFJLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFBO0lBQ2xFLENBQUM7SUFFRCxZQUE2QixJQUFZO1FBQVosU0FBSSxHQUFKLElBQUksQ0FBUTtJQUFHLENBQUM7SUFFN0MsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUE0QjtRQUNyQyxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQTtRQUN0QixJQUFJLENBQUMsY0FBYztZQUNqQixJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0NBQXNDLEVBQUUsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFBO1FBQ2xGLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixFQUFFLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQTtRQUNuRixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUNsQyxDQUFDO0lBRUQsS0FBSyxDQUFDLEdBQUcsQ0FBSSxHQUFXO1FBQ3RCLE1BQU0sSUFBSSxDQUFDLElBQUksRUFBRSxDQUFBO1FBQ2pCLE1BQU0sUUFBUSxHQUFHLE1BQU0sS0FBSyxDQUFDLEdBQUcsSUFB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
