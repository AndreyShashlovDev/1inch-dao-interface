import { JsonParser } from '@1inch-community/core/storage'
import {
  IApplicationContext,
  IToken,
  NullableValue,
  Pair,
  TokenType,
} from '@1inch-community/models'
import { startWith, Subject, Subscription, switchMap } from 'rxjs'
import { isChainId } from '../chain/is-chain-id'
import { isTokensEqual } from '../tokens/is-tokens-equal'
import { TokenContext } from './token-context'

export class PairHolder {
  private readonly subscription = new Subscription()
  private source = new TokenContext()
  private destination = new TokenContext()

  private readonly pairChance$ = new Subject<void>()

  constructor(private readonly applicationContext: IApplicationContext) {}

  init() {
    this.restorePair()
    this.startChainTokenSync()
  }

  restorePair() {
    this.restoreToken('source')
    this.restoreToken('destination')
  }

  switchPair() {
    const { source, destination } = this
    this.source = destination
    this.destination = source
    this.updateTokenStore('source')
    this.updateTokenStore('destination')
    this.pairChance$.next()
  }

  setPair(pair: NullableValue<Pair>): void {
    this.setTokenInner(pair.source, 'source')
    this.setTokenInner(pair.destination, 'destination')
    this.pairChance$.next()
  }

  setToken(token: IToken | null, tokenType: TokenType) {
    if (tokenType === 'source' && token !== null) {
      const destinationTokenSnap = this.destination.getSnapshot()
      if (destinationTokenSnap.token !== null && isTokensEqual(token, destinationTokenSnap.token)) {
        return this.switchPair()
      }
    }
    if (tokenType === 'destination' && token !== null) {
      const sourceTokenSnap = this.source.getSnapshot()
      if (sourceTokenSnap.token !== null && isTokensEqual(token, sourceTokenSnap.token)) {
        return this.switchPair()
      }
    }
    this.setTokenInner(token, tokenType)
  }

  setAmount(tokenType: TokenType, value: bigint) {
    this.getTokenContext(tokenType).setAmount(value)
    this.updateTokenStore(tokenType)
  }

  streamSnapshot(tokenType: TokenType) {
    return this.pairChance$.pipe(
      startWith(null),
      switchMap(() => this.getTokenContext(tokenType).streamSnapshot())
    )
  }

  getSnapshot(tokenType: TokenType) {
    return this.getTokenContext(tokenType).getSnapshot()
  }

  destroy() {
    this.subscription.unsubscribe()
  }

  private setTokenInner(token: IToken | null, tokenType: TokenType) {
    this.getTokenContext(tokenType).setToken(token)
    this.updateTokenStore(tokenType)
  }

  private getTokenContext(tokenType: TokenType) {
    if (tokenType === 'source') {
      return this.source
    }
    if (tokenType === 'destination') {
      return this.destination
    }
    throw new Error(`invalid token type ${tokenType}`)
  }

  private updateTokenStore(tokenType: TokenType) {
    const tokenContext = this.getTokenContext(tokenType)
    const snapshot = tokenContext.getSnapshot()
    const amount = snapshot.amount
    if (amount !== null) {
      this.applicationContext.storage.set(
        this.tokenStoreKey(tokenType) + '_amount',
        amount.toString()
      )
    }
    if (snapshot.token !== null) {
      const { symbol, address, chainId, name, decimals } = snapshot.token
      this.applicationContext.storage.set(this.tokenStoreKey(tokenType), {
        symbol,
        address,
        chainId,
        name,
        decimals,
      })
    }
  }

  private restoreToken(tokenType: TokenType) {
    const tokenContext = this.getTokenContext(tokenType)
    const amount = this.applicationContext.storage.get<string>(
      this.tokenStoreKey(tokenType) + '_amount',
      String
    )
    const token = this.applicationContext.storage.get<IToken>(
      this.tokenStoreKey(tokenType),
      JsonParser
    )

    if (token !== null) {
      tokenContext.setToken(token)
    }

    if (amount !== null) {
      tokenContext.setAmount(BigInt(amount))
    }
  }

  private tokenStoreKey(tokenType: TokenType) {
    return `token_${tokenType}`
  }

  private startChainTokenSync() {
    this.subscription.add(
      this.applicationContext.wallet.data.chainId$
        .pipe(
          switchMap(async (chainId) => {
            if (!chainId || !isChainId(chainId)) return
            const sourceTokenSnap = this.source.getSnapshot()
            const destinationTokenSnap = this.destination.getSnapshot()
            if (sourceTokenSnap.token && sourceTokenSnap.token.chainId !== chainId) {
              const token = await this.applicationContext.tokenStorage.getNativeToken(chainId)
              this.setTokenInner(token, 'source')
            }
            if (destinationTokenSnap.token && destinationTokenSnap.token.chainId !== chainId) {
              this.setTokenInner(null, 'destination')
            }
          })
        )
        .subscribe()
    )
  }
}
