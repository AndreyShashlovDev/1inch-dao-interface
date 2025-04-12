import { lazyAppContext } from '@1inch-community/core/lazy'
import { IApplicationContext, IProxyClient } from '@1inch-community/models'

export class PublicProxyClient implements IProxyClient {
  private readonly context = lazyAppContext('PublicProxyClient')

  get isAuth() {
    return true
  }

  get host() {
    return this.context.value.environment.get('oneInchDevPortalHost')
  }

  get token() {
    return this.context.value.environment.get('oneInchDevPortalToken')
  }

  async init(context: IApplicationContext) {
    this.context.set(context)
  }

  async get<T>(url: string): Promise<T> {
    const response = await fetch(`${this.host}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
    })
    return await response.json()
  }

  async post<T, Body = unknown>(url: string, body: Body): Promise<T> {
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
}
