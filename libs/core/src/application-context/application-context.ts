import {
  IAnimationsManager,
  IApplicationContext,
  IEnvironmentController,
  Ii18nManager,
  ILogger,
  INotificationsManager,
  IOnChain,
  IOneInchDevPortalCrossChainAdapter,
  IPersistSyncStorage,
  ISettingsManager,
  ISwapContext,
  IThemeManager,
  ITokenRateProvider,
  ITokenStorage,
  ITurnstileController,
  IWallet,
} from '@1inch-community/models'

export type ApplicationContextPayload = {
  walletFactory: () => Promise<IWallet>
  tokenControllerFactory: () => Promise<ITokenStorage>
  notificationsManagerFactory: () => Promise<INotificationsManager>
  i18nManagerFactory: () => Promise<Ii18nManager>
  themesManagerFactory: () => Promise<IThemeManager>
  storageManagerFactory: () => Promise<IPersistSyncStorage>
  tokenRateProviderFactory: () => Promise<ITokenRateProvider>
  apiFactory: () => Promise<IOneInchDevPortalCrossChainAdapter>
  loggerFactory: () => Promise<ILogger>
  turnstileFactory: () => Promise<ITurnstileController>
  onChainFactory: () => Promise<IOnChain>
  settingsFactory: () => Promise<ISettingsManager>
  animationsFactory: () => Promise<IAnimationsManager>
  environmentFactory: () => Promise<IEnvironmentController>
  swapContextFactory: (context: IApplicationContext) => Promise<ISwapContext>
}

const contextNotInitErrorMessage = 'ApplicationContext not init'

export class ApplicationContext implements IApplicationContext {
  private _wallet?: IWallet
  private _tokenController?: ITokenStorage
  private _notifications?: INotificationsManager
  private _i18n?: Ii18nManager
  private _theme?: IThemeManager
  private _storageManager?: IPersistSyncStorage
  private _tokenRateProvider?: ITokenRateProvider
  private _api?: IOneInchDevPortalCrossChainAdapter
  private _logger?: ILogger
  private _turnstile?: ITurnstileController
  private _chainController?: IOnChain
  private _settings?: ISettingsManager
  private _animations?: IAnimationsManager
  private _environment?: IEnvironmentController

  private _activeSwapContext: WeakRef<ISwapContext> | null = null

  get wallet(): IWallet {
    if (!this._wallet) throw new Error(contextNotInitErrorMessage)
    return this._wallet
  }

  get tokenStorage(): ITokenStorage {
    if (!this._tokenController) throw new Error(contextNotInitErrorMessage)
    return this._tokenController
  }

  get notifications(): INotificationsManager {
    if (!this._notifications) throw new Error(contextNotInitErrorMessage)
    return this._notifications
  }

  get i18n(): Ii18nManager {
    if (!this._i18n) throw new Error(contextNotInitErrorMessage)
    return this._i18n
  }

  get theme(): IThemeManager {
    if (!this._theme) throw new Error(contextNotInitErrorMessage)
    return this._theme
  }

  get storage(): IPersistSyncStorage {
    if (!this._storageManager) throw new Error(contextNotInitErrorMessage)
    return this._storageManager
  }

  get tokenRateProvider(): ITokenRateProvider {
    if (!this._tokenRateProvider) throw new Error(contextNotInitErrorMessage)
    return this._tokenRateProvider
  }

  get api(): IOneInchDevPortalCrossChainAdapter {
    if (!this._api) throw new Error(contextNotInitErrorMessage)
    return this._api
  }

  get logger(): ILogger {
    if (!this._logger) throw new Error(contextNotInitErrorMessage)
    return this._logger
  }

  get turnstile(): ITurnstileController {
    if (!this._turnstile) throw new Error(contextNotInitErrorMessage)
    return this._turnstile
  }

  get onChain(): IOnChain {
    if (!this._chainController) throw new Error(contextNotInitErrorMessage)
    return this._chainController
  }

  get settings(): ISettingsManager {
    if (!this._settings) throw new Error(contextNotInitErrorMessage)
    return this._settings
  }

  get animations(): IAnimationsManager {
    if (!this._animations) throw new Error(contextNotInitErrorMessage)
    return this._animations
  }

  get environment(): IEnvironmentController {
    if (!this._environment) throw new Error(contextNotInitErrorMessage)
    return this._environment
  }

  constructor(
    private readonly payload: ApplicationContextPayload,
    public readonly isEmbedded = false
  ) {}

  async init(): Promise<void> {
    const [
      wallet,
      tokenStorage,
      notifications,
      i18n,
      theme,
      storage,
      tokenRateProvider,
      api,
      logger,
      turnstile,
      onChain,
      settings,
      animations,
      environment,
    ] = await Promise.all([
      this.payload.walletFactory(),
      this.payload.tokenControllerFactory(),
      this.payload.notificationsManagerFactory(),
      this.payload.i18nManagerFactory(),
      this.payload.themesManagerFactory(),
      this.payload.storageManagerFactory(),
      this.payload.tokenRateProviderFactory(),
      this.payload.apiFactory(),
      this.payload.loggerFactory(),
      this.payload.turnstileFactory(),
      this.payload.onChainFactory(),
      this.payload.settingsFactory(),
      this.payload.animationsFactory(),
      this.payload.environmentFactory(),
    ])
    this._wallet = wallet
    this._tokenController = tokenStorage
    this._notifications = notifications
    this._i18n = i18n
    this._theme = theme
    this._storageManager = storage
    this._tokenRateProvider = tokenRateProvider
    this._api = api
    this._logger = logger
    this._turnstile = turnstile
    this._chainController = onChain
    this._settings = settings
    this._animations = animations
    this._environment = environment
    await Promise.all([
      this._logger.init(this),
      this._settings.init(this),
      this._i18n.init(this),
      this._theme.init(this),
      this._wallet.init(this),
      this._notifications.init(this),
      this._tokenController.init(this),
      this._tokenRateProvider.init(this),
      this._api.init(this),
      this._turnstile.init(this),
      this._chainController.init(this),
      this._animations.init(this),
    ])
  }

  async makeSwapContext(): Promise<ISwapContext> {
    const context = await this.payload.swapContextFactory(this)
    this._activeSwapContext = new WeakRef(context)
    return context
  }

  getActiveSwapContext(): ISwapContext | null {
    return this._activeSwapContext?.deref() ?? null
  }
}
