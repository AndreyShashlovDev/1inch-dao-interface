import { ILazyValue, LazyValueFactory } from '@1inch-community/models'

export class LazyValue<T> implements ILazyValue<T> {
  private _value: T | undefined

  get value(): T {
    if (this._value === undefined) {
      const error = this.error()
      if (error instanceof Error) throw error
      throw new Error(error)
    }
    return this._value
  }

  constructor(private readonly error: () => Error | string) {}

  set(value: T): void {
    this._value = value
  }
}

export const lazyValue: LazyValueFactory = <T>(error: () => Error | string) =>
  new LazyValue<T>(error)
