import { IApplicationContext, IProxyClient } from '@1inch-community/models'
export declare class PrivateProxyClient implements IProxyClient {
  private readonly host
  private token
  private expirationTime
  private context?
  get isAuth(): boolean
  constructor(host: string)
  init(context: IApplicationContext): Promise<void>
  get<T>(url: string): Promise<T>
  post<T, Body = unknown>(url: string, body: Body): Promise<T>
  private auth
}
