import { IApplicationContext } from '../application-context'

export interface IProxyClient {
  readonly isAuth: boolean
  init(context: IApplicationContext): Promise<void>
  get<T>(url: string): Promise<T>
  post<T, Body = unknown>(url: string, body: Body): Promise<T>
}
