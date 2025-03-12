import { asyncTimeout } from '@1inch-community/core/async'
import { Animation } from './animation'

export function noopAnimation(): Animation {
  return {
    preparation: async () => void 0,
    transition: async () => {
      await asyncTimeout(100)
    },
  }
}
