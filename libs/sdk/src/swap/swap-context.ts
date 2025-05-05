import { lazy } from '@1inch-community/core/lazy'
import {
  IApplicationContext,
  IOneInchDevPortalCrossChainAdapter,
  ISwapContext,
  ISwapContextStrategy,
  ISwapContextStrategyDataSnapshot,
  IToken,
  ITokenTransferRequirementResolver,
  IWallet,
  NullableValue,
  Pair,
  ResolverResult,
  SettingsValue,
  SwapSettings,
  SwapSnapshot,
  TokenType,
} from '@1inch-community/models'
import {
  asyncScheduler,
  BehaviorSubject,
  combineLatest,
  debounceTime,
  defer,
  distinctUntilChanged,
  firstValueFrom,
  map,
  merge,
  Observable,
  of,
  shareReplay,
  startWith,
  Subject,
  subscribeOn,
  Subscription,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs'
import { Hash, maxUint256 } from 'viem'
import { getOneInchRouterV6ContractAddress, isNativeToken } from '../chain'
import { OneInchCrossChainSDK } from '../one-inch-dev-portal/sdk/1inch-cross-chain-sdk'
import { OneInchSingleChainSDK } from '../one-inch-dev-portal/sdk/1inch-single-chain-sdk'
import { PairHolder } from './pair-holder'
import { SwapContextFusionPlusStrategy } from './swap-context-fusion-plus.strategy'
import { SwapContextFusionStrategy } from './swap-context-fusion.strategy'
import { SwapContextOnChainStrategy } from './swap-context-onchain.strategy'

export class SwapContext implements ISwapContext {
  private readonly pairHolder: PairHolder
  private readonly oneInchApiAdapter: IOneInchDevPortalCrossChainAdapter
  private readonly wallet: IWallet

  private readonly subscription = new Subscription()
  private readonly settings = lazy<SwapSettings>(() => ({
    slippage: this.context.settings.getSetting('slippage'),
    auctionTime: this.context.settings.getSetting('auctionTime'),
  }))
  private readonly strategies: ISwapContextStrategy<unknown>[]

  readonly loading$ = new BehaviorSubject(false)

  readonly chainId$ = defer(() => this.wallet.data.chainId$).pipe(distinctUntilChanged())
  readonly connectedWalletAddress$ = defer(() => this.wallet.data.activeAddress$).pipe(
    distinctUntilChanged()
  )
  readonly block$ = this.chainId$.pipe(
    switchMap((chainId) => (chainId ? this.context.onChain.getBlockEmitter(chainId) : of(null)))
  )

  private readonly updateData$ = new Subject<void>()
  private readonly updateDataComplete$ = new Subject<void>()

  private readonly dataUpdateEmitter$: Observable<void> = merge(
    this.block$,
    this.chainId$,
    this.connectedWalletAddress$,
    defer(() => this.pairHolder.streamSnapshot('source')),
    defer(() => this.pairHolder.streamSnapshot('destination')),
    this.updateData$
  ).pipe(
    debounceTime(500),
    map(() => void 0),
    startWith(void 0),
    shareReplay({ bufferSize: 1, refCount: true })
  )

  private readonly dataSnapshot$: Observable<ISwapContextStrategyDataSnapshot | null> =
    this.dataUpdateEmitter$.pipe(
      withLatestFrom(this.connectedWalletAddress$),
      switchMap(() => {
        this.loading$.next(true)
        return this.getDataSnapshot()
      }),
      tap(() => {
        this.loading$.next(false)
        this.updateDataComplete$.next()
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    )

  readonly rate$ = this.dataSnapshot$.pipe(map((snapshot) => snapshot?.rate ?? null))

  readonly minReceive$ = this.dataSnapshot$.pipe(map((snapshot) => snapshot?.minReceive ?? 0n))

  readonly destinationTokenAmount$ = this.dataSnapshot$.pipe(
    map((snapshot) => snapshot?.destinationTokenAmount ?? 0n)
  )

  readonly autoSlippage$ = this.dataSnapshot$.pipe(
    map((snapshot) => snapshot?.autoSlippage ?? null)
  )

  readonly autoAuctionTime$ = this.dataSnapshot$.pipe(
    map((snapshot) => snapshot?.autoAuctionTime ?? null)
  )

  readonly slippage$: Observable<SettingsValue> = combineLatest([
    this.autoSlippage$,
    defer(() => this.settings.value.slippage.value$),
  ]).pipe(
    map(([autoSlippage, slippageSettings]) => {
      if (slippageSettings) return { type: slippageSettings[1], value: slippageSettings[0] }
      return { type: 'auto', value: autoSlippage } as const
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  )

  readonly auctionTime$: Observable<SettingsValue> = combineLatest([
    this.autoAuctionTime$,
    defer(() => this.settings.value.auctionTime.value$),
  ]).pipe(
    map(([autoAuctionTime, auctionTimeSettings]) => {
      if (auctionTimeSettings) {
        return { type: auctionTimeSettings[1], value: auctionTimeSettings[0] }
      }
      return { type: 'auto', value: autoAuctionTime } as const
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  )

  constructor(
    private readonly context: IApplicationContext,
    private readonly tokenTransferRequirementsResolver: ITokenTransferRequirementResolver
  ) {
    this.pairHolder = new PairHolder(this.context)
    this.oneInchApiAdapter = this.context.api
    this.wallet = this.context.wallet

    // setup strategies by priority
    this.strategies = [
      new SwapContextFusionPlusStrategy(
        new OneInchCrossChainSDK(this.context),
        this.wallet,
        this.pairHolder,
        this,
        this.settings.value
      ),
      new SwapContextFusionStrategy(
        new OneInchSingleChainSDK(this.context),
        this,
        this.pairHolder,
        this.wallet,
        this.settings.value
      ),
      new SwapContextOnChainStrategy(this.pairHolder, this.wallet, this.context.tokenRateProvider),
    ]
  }

  init() {
    this.pairHolder.init()

    this.subscription.add(
      merge(
        this.destinationTokenAmount$.pipe(
          distinctUntilChanged(),
          tap((amount) => {
            this.setTokenAmountByType('destination', amount)
          }),
          subscribeOn(asyncScheduler)
        )
      ).subscribe()
    )
  }

  wrapNativeToken(): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async getApprove(): Promise<Hash> {
    const chainId = await this.context.wallet.data.getChainId()
    const sourceTokenSnapshot = this.pairHolder.getSnapshot('source')
    const owner = await this.context.wallet.data.getActiveAddress()
    if (!chainId || !sourceTokenSnapshot || !sourceTokenSnapshot.token || !owner) {
      throw new Error('')
    }
    const spender = getOneInchRouterV6ContractAddress(chainId)
    const result = await this.context.onChain.simulateApprove(
      chainId,
      sourceTokenSnapshot.token.address,
      owner,
      spender,
      maxUint256
    )
    return await this.context.wallet.writeContract(result)
  }

  getSettingsController<V extends keyof SwapSettings>(name: V): SwapSettings[V] {
    const controller = this.settings.value[name]
    if (!controller) throw new Error('')
    return controller
  }

  async getPermit(): Promise<void> {
    // const chainId = await this.wallet.data.getChainId();
    // const walletAddress = await this.wallet.data.getActiveAddress();
    // const tokenSnapshot = this.pairHolder.getSnapshot('source');
    // if (!chainId || !walletAddress || !isTokenSnapshotNotNullable(tokenSnapshot)) {
    //   throw new Error('');
    // }
    // const signFromStorage = await getPermit(
    //   chainId,
    //   tokenSnapshot.token.address,
    //   walletAddress,
    //   getOneInchRouterV6ContractAddress(chainId)
    // );
    // if (signFromStorage !== null) return;
    // const typeData = await getPermit2TypeData(
    //   chainId,
    //   tokenSnapshot.token.address,
    //   walletAddress,
    //   getOneInchRouterV6ContractAddress(chainId)
    // );
    // const sign = await this.wallet.signTypedData(typeData);
    // await savePermit(
    //   chainId,
    //   tokenSnapshot.token.address,
    //   walletAddress,
    //   getOneInchRouterV6ContractAddress(chainId),
    //   sign,
    //   typeData.message as any
    // );
  }

  public async provideTransferRequirements(): Promise<ResolverResult | null> {
    const snapshot = this.pairHolder.getSnapshot('source')
    const sourceToken = snapshot.token
    const connectedWalletAddress = await this.wallet.data.getActiveAddress()

    if (!sourceToken) {
      throw new Error('select token before')
    }

    if (!connectedWalletAddress) {
      throw new Error('connect wallet before')
    }

    if (!snapshot.amount) {
      throw new Error('change amount before')
    }

    return this.tokenTransferRequirementsResolver.provideRequirements(
      sourceToken.chainId,
      connectedWalletAddress,
      sourceToken.address,
      snapshot.amount
    )
  }

  destroy() {
    this.pairHolder.destroy()
    this.subscription.unsubscribe()
  }

  setPair(pair: NullableValue<Pair>): void {
    this.pairHolder.setPair(pair)
  }

  setToken(tokenType: TokenType, token: IToken) {
    this.pairHolder.setToken(token, tokenType)
  }

  switchPair() {
    this.pairHolder.switchPair()
  }

  async getSnapshot(): Promise<SwapSnapshot> {
    this.updateData$.next()
    await firstValueFrom(this.updateDataComplete$)
    const [swapSnapshot, slippage, auctionTime] = await Promise.all([
      firstValueFrom(this.dataSnapshot$),
      firstValueFrom(this.slippage$),
      firstValueFrom(this.auctionTime$),
    ])
    return {
      ...swapSnapshot,
      slippage,
      auctionTime,
    } as SwapSnapshot
  }

  async swap(swapSnapshot: SwapSnapshot): Promise<Hash> {
    const pair: Pair = {
      source: swapSnapshot.sourceToken,
      destination: swapSnapshot.destinationToken,
    }

    const strategy = await this.getSupportStrategy(pair)
    return await strategy.swap(swapSnapshot)
  }

  async getMaxAmount(): Promise<bigint> {
    const snapshot = this.pairHolder.getSnapshot('source')
    const sourceToken = snapshot.token
    const connectedWalletAddress = await this.wallet.data.getActiveAddress()
    if (!sourceToken || !connectedWalletAddress) return 0n
    const balance = await this.context.tokenStorage.getTokenBalance(
      sourceToken.chainId,
      sourceToken.address,
      connectedWalletAddress
    )
    let amount = BigInt(balance?.amount ?? 0)
    if (isNativeToken(sourceToken.address)) {
      const chainId = await this.wallet.data.getChainId()
      if (!chainId) return 0n
      const [gasUnits, gasPriceDTO] = await Promise.all([
        this.context.onChain.estimateWrapNativeToken(chainId, amount),
        this.oneInchApiAdapter.getGasPrice(chainId),
      ])
      if (!gasPriceDTO) return 0n
      const gasPrice = gasPriceDTO.high
      const fee = gasUnits * (BigInt(gasPrice.maxFeePerGas) + BigInt(gasPrice.maxPriorityFeePerGas))
      amount = amount - fee
      if (amount < 0n) {
        amount = 0n
      }
    }
    return amount
  }

  async setMaxAmount() {
    const amount = await this.getMaxAmount()
    this.setTokenAmountByType('source', amount)
  }

  getTokenByType(type: TokenType): Observable<IToken | null> {
    return this.pairHolder.streamSnapshot(type).pipe(
      map((snapshot) => snapshot.token),
      distinctUntilChanged()
    )
  }

  getTokenAmountByType(type: TokenType): Observable<bigint | null> {
    return this.pairHolder.streamSnapshot(type).pipe(
      map((snapshot) => {
        return snapshot.amount
      }),
      distinctUntilChanged()
    )
  }

  getTokenRawAmountByType(type: TokenType): Observable<bigint | null> {
    return this.pairHolder.streamSnapshot(type).pipe(
      map((snapshot) => snapshot.amount),
      distinctUntilChanged()
    )
  }

  setTokenAmountByType(type: TokenType, value: bigint): void {
    this.pairHolder.setAmount(type, value)
  }

  private async getSupportStrategy(pair: Pair): Promise<ISwapContextStrategy<unknown>> {
    for (const strategy of this.strategies) {
      if (await strategy.supportSwap(pair)) {
        return strategy
      }
    }

    throw new Error('Supported strategy for pair not found')
  }

  private async getDataSnapshot(): Promise<ISwapContextStrategyDataSnapshot | null> {
    for (const strategy of this.strategies) {
      try {
        return await strategy.getDataSnapshot()
      } catch (e) {
        /* ignore */
      }
    }

    return null
  }
}
