import { ChainId, IApplicationContext, IWalletAccountContext } from '@1inch-community/models'
import { defer, Observable, shareReplay, switchMap } from 'rxjs'
import type { Address } from 'viem'

export class WalletAccountContext implements IWalletAccountContext {
  readonly connectedWalletAddress$: Observable<Address | null> = defer(
    () => this.applicationContext.wallet.data.activeAddress$
  )
  readonly chainId$: Observable<ChainId | null> = defer(
    () => this.applicationContext.wallet.data.chainId$
  )

  readonly tokenViewData$ = this.connectedWalletAddress$.pipe(
    switchMap(
      (address: Address | null) => this.applicationContext.tokenStorage.getSymbolData(address ?? undefined)
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  )

  constructor(
    private readonly applicationContext: IApplicationContext,
  ) {}
}
