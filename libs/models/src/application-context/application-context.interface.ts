import { IAnimationsManager } from '../animations'
import { IOneInchDevPortalCrossChainAdapter } from '../api'
import { IOnChain } from '../chain'
import { IEnvironmentController } from '../environment'
import { Ii18nManager } from '../i18n'
import { ILogger } from '../logger'
import { INotificationsManager } from '../notifications'
import { ISettingsManager } from '../settings'
import { IPersistSyncStorage } from '../storage'
import { ISwapContext } from '../swap'
import { IThemeManager } from '../themes'
import { ITokenStorage } from '../token'
import { ITokenRateProvider } from '../token-price'
import { ITurnstileController } from '../turnstile'
import { IWallet } from '../wallet'

export interface IApplicationContext {
  readonly isEmbedded: boolean
  readonly wallet: IWallet
  readonly tokenStorage: ITokenStorage
  readonly tokenRateProvider: ITokenRateProvider
  readonly notifications: INotificationsManager
  readonly i18n: Ii18nManager
  readonly theme: IThemeManager
  readonly storage: IPersistSyncStorage
  readonly api: IOneInchDevPortalCrossChainAdapter
  readonly logger: ILogger
  readonly turnstile: ITurnstileController
  readonly settings: ISettingsManager
  readonly onChain: IOnChain
  readonly animations: IAnimationsManager
  readonly environment: IEnvironmentController

  makeSwapContext(): Promise<ISwapContext>

  getActiveSwapContext(): ISwapContext | null
}
