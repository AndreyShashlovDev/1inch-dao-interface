import { IOverlayContext } from '@1inch-community/models'
import { createContext } from '@lit/context'

export const overlayContextToken = createContext<IOverlayContext>(Symbol('overlay context'))
