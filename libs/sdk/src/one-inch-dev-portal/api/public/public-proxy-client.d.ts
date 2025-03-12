import { IProxyClient } from '@1inch-community/models'
export declare class PublicProxyClient implements IProxyClient {
  private readonly host
  private readonly token?
  get isAuth(): boolean
  constructor(host: string, token?: string | undefined)
  init(): Promise<void>
  get<T>(url: string): Promise<T>
  post<T, Body = unknown>(url: string, body: Body): Promise<T>
}
