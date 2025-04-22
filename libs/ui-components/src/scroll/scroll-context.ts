import { createContext } from '@lit/context'
import { Observable } from 'rxjs'

export interface ScrollContext extends HTMLElement {
  readonly maxHeight?: number
  readonly scrollTopFromConsumer: number
  readonly scrollTopFromConsumer$: Observable<number>
  readonly showStubView$: Observable<boolean>
  readonly setMaxHeight?: boolean
  setScrollTopFromConsumer(state: number): void
  onChangeStubView(state: boolean): void
}

export const scrollContext = createContext<ScrollContext>(Symbol('scrollContext'))
