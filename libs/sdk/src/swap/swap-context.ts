import { BigFloat } from '@1inch-community/core/math'
import {
  IAmountDataSource,
  IBigFloat,
  IOnChain,
  ISwapContext,
  ISwapContextStrategy,
  ISwapContextStrategyDataSnapshot,
  IToken,
  IWallet,
  NullableValue,
  Pair,
  SettingsValue,
  SwapOrderStatus,
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
import { isTokensEqual } from 'tokens'
import { Hash } from 'viem'
import { getOneInchRouterV6ContractAddress } from '../chain'
import { PairHolder } from './pair-holder'

export class SwapContext implements ISwapContext {
  private readonly subscription = new Subscription()

  readonly loading$ = new BehaviorSubject(false)

  readonly chainId$ = defer(() => this.wallet.data.chainId$).pipe(distinctUntilChanged())
  readonly connectedWalletAddress$ = defer(() => this.wallet.data.activeAddress$).pipe(
    distinctUntilChanged()
  )
  readonly block$ = this.chainId$.pipe(
    switchMap((chainId) => (chainId ? this.onChain.getBlockEmitter(chainId) : of(null)))
  )

  private readonly updateData$ = new Subject<void>()
  private readonly updateDataComplete$ = new Subject<void>()

  private readonly dataUpdateEmitter$: Observable<void> = merge(
    this.onChain.crossChainEmitter,
    this.connectedWalletAddress$,
    defer(() => this.pairHolder.streamSnapshot('source')),
    defer(() => this.pairHolder.streamSnapshot('destination')).pipe(
      map((snapshot) => snapshot.token),
      distinctUntilChanged(isTokensEqual)
    ),
    this.updateData$
  ).pipe(
    debounceTime(1000),
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

  readonly minReceive$ = this.dataSnapshot$.pipe(
    map((snapshot) => snapshot?.minReceive ?? BigFloat.zero())
  )

  readonly destinationTokenAmount$ = this.dataSnapshot$.pipe(
    map((snapshot) => snapshot?.destinationTokenAmount ?? BigFloat.zero())
  )

  readonly autoSlippage$ = this.dataSnapshot$.pipe(
    map((snapshot) => snapshot?.autoSlippage ?? null)
  )

  readonly autoAuctionTime$ = this.dataSnapshot$.pipe(
    map((snapshot) => snapshot?.autoAuctionTime ?? null)
  )

  readonly slippage$: Observable<SettingsValue> = combineLatest([
    this.autoSlippage$,
    defer(() => this.settings.slippage.value$),
  ]).pipe(
    map(([autoSlippage, slippageSettings]) => {
      if (slippageSettings) return { type: slippageSettings[1], value: slippageSettings[0] }
      return { type: 'auto', value: autoSlippage } as const
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  )

  readonly auctionTime$: Observable<SettingsValue> = combineLatest([
    this.autoAuctionTime$,
    defer(() => this.settings.auctionTime.value$),
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
    private readonly wallet: IWallet,
    private readonly onChain: IOnChain,
    private readonly settings: SwapSettings,
    private readonly pairHolder: PairHolder,
    private readonly amountDataSource: IAmountDataSource,
    private readonly strategies: ISwapContextStrategy<unknown>[]
  ) {}

  init() {
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
    const chainId = await this.wallet.data.getChainId()
    const sourceTokenSnapshot = this.pairHolder.getSnapshot('source')
    const owner = await this.wallet.data.getActiveAddress()
    if (!chainId || !sourceTokenSnapshot || !sourceTokenSnapshot.token || !owner) {
      throw new Error('')
    }
    const spender = getOneInchRouterV6ContractAddress(chainId)
    const result = await this.onChain.simulateApprove(
      chainId,
      sourceTokenSnapshot.token.address,
      owner,
      spender,
      BigFloat.maxUint256()
    )
    return await this.wallet.writeContract(result)
  }

  getSettingsController<V extends keyof SwapSettings>(name: V): SwapSettings[V] {
    const controller = this.settings[name]
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

  destroy() {
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

  async getMaxAmount(): Promise<IBigFloat> {
    return this.amountDataSource.getMaxAmount()
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

  getTokenAmountByType(type: TokenType): Observable<IBigFloat | null> {
    return this.pairHolder.streamSnapshot(type).pipe(
      map((snapshot) => {
        return snapshot.amount
      }),
      distinctUntilChanged()
    )
  }

  getTokenRawAmountByType(type: TokenType): Observable<IBigFloat | null> {
    return this.pairHolder.streamSnapshot(type).pipe(
      map((snapshot) => snapshot.amount),
      distinctUntilChanged()
    )
  }

  setTokenAmountByType(type: TokenType, value: IBigFloat): void {
    this.pairHolder.setAmount(type, value)
  }

  public async getOrderStatus(orderHash: Hash): Promise<SwapOrderStatus> {
    throw new Error('Not implemented yet')
  }

  public cancelOrder(orderHash: Hash): Promise<Hash | null> {
    throw new Error('Not implemented yet')
  }

  private async getSupportStrategy(pair: Pair): Promise<ISwapContextStrategy<unknown>> {
    const walletAddress = await this.wallet.data.getActiveAddress()

    for (const strategy of this.strategies) {
      if (await strategy.supportSwap(pair, walletAddress)) {
        return strategy
      }
    }

    throw new Error('Supported strategy for pair not found')
  }

  private async getDataSnapshot(): Promise<ISwapContextStrategyDataSnapshot | null> {
    const { token: source, amount } = this.pairHolder.getSnapshot('source')
    const { token: destination } = this.pairHolder.getSnapshot('destination')
    const walletAddress = await this.wallet.data.getActiveAddress()

    if (!source || !destination || !amount) {
      throw new Error('')
    }

    for (const strategy of this.strategies) {
      try {
        return await strategy.getDataSnapshot({ source, destination }, amount, walletAddress)
      } catch (e) {
        /* ignore */
      }
    }

    return null
  }
}
