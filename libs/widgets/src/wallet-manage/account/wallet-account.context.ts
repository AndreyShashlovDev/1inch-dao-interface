import {
  ChainId,
  EIP6963ProviderInfo,
  ITokenStorage,
  IWallet,
  IWalletAccountContext,
} from '@1inch-community/models'
import { IBigFloat } from '@1inch-community/models'
import { defer, distinctUntilChanged, filter, Observable, shareReplay, switchMap } from 'rxjs'
import type { Address } from 'viem'

export class WalletAccountContext implements IWalletAccountContext {
  readonly connectedWalletInfo$: Observable<EIP6963ProviderInfo | null> = defer(
    () => this.wallet.data.info$
  )
  readonly connectedWalletAddress$: Observable<Address | null> = defer(
    () => this.wallet.data.activeAddress$
  )
  readonly chainId$: Observable<ChainId | null> = defer(() => this.wallet.data.chainId$)

  readonly tokenViewData$ = this.connectedWalletAddress$.pipe(
    switchMap((address: Address | null) => this.tokenStorage.getSymbolData(address ?? undefined)),
    shareReplay({ bufferSize: 1, refCount: true })
  )

  readonly walletBalance$: Observable<IBigFloat> = this.connectedWalletAddress$.pipe(
    distinctUntilChanged(),
    filter((address) => address !== null),
    switchMap((address) => this.tokenStorage.getCrossChainTotalFiatBalance(address))
  )

  constructor(
    private readonly wallet: IWallet,
    private readonly tokenStorage: ITokenStorage
  ) {}
}
