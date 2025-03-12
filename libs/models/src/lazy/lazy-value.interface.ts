export interface ILazyValue<T> {
  readonly value: T
  set(value: T): void
}

export type LazyValueFactory = <T>(error: () => Error | string) => ILazyValue<T>
