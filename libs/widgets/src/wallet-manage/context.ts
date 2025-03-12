import { IWallet } from '@1inch-community/models'
import { createContext } from '@lit/context'

export const controllerContext = createContext<IWallet>(Symbol('controller context'))
