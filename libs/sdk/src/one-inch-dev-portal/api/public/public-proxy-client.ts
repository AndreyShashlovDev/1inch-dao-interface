import { IProxyClient } from '@1inch-community/models'

export class PublicProxyClient implements IProxyClient {
  get isAuth() {
    return true
  }

  constructor(
    private readonly host: string,
    private readonly token?: string
  ) {}

  async init() {}

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
