import { IApplicationContext, ILazyValue } from '@1inch-community/models'
import { ContextConsumer } from '@lit/context'
import type { ReactiveControllerHost } from 'lit'
import { ApplicationContextToken } from '../application-context'
import { ApplicationContextInitializedError } from './lazy-app-context'
import { lazyValue } from './lazy-value'

export function lazyAppContextConsumer(
  host: ReactiveControllerHost & HTMLElement
): ILazyValue<IApplicationContext> {
  const context = new ContextConsumer(host, { context: ApplicationContextToken, subscribe: true })
  return lazyValue(
    () => new ApplicationContextInitializedError(host.tagName),
    () => context.value
  )
}
