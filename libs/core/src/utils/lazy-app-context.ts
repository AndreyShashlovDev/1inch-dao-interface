import { IApplicationContext, ILazyValue } from '@1inch-community/models'
import { lazyValue } from './lazy-value'

class ApplicationContextInitializedError extends Error {
  constructor(initPoint?: unknown) {
    super('ApplicationContext not initialized.')
  }
}

export const lazyAppContext = (initPoint?: unknown): ILazyValue<IApplicationContext> => {
  return lazyValue(() => new ApplicationContextInitializedError(initPoint))
}
