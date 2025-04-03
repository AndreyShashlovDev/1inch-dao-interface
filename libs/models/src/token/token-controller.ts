import type { Observable } from 'rxjs'
import type { Address } from 'viem'
import type { InitializingEntity } from '../base'
import type { IBigFloat } from '../big-float'
import type { ChainId } from '../chain'
import type { IBalancesTokenRecord, TokenRecordId } from '../database'
import type { IToken } from './token'
import type { ITokenListViewData } from './token-list-view-data'

export interface ITokenStorage extends InitializingEntity {
  getCrossChainTokenBalance(symbol: string, walletAddress: Address): Promise<IBigFloat>
  getCrossChainTokenByPriority(symbol: string): Promise<IToken | null>
  getCrossChainTokenName(symbol: string): Promise<string>
  getCrossChainTokenIdListWithBalance(
    symbol: string,
    walletAddress: Address
  ): Promise<TokenRecordId[]>
  getCrossChainTokenFiatBalance(symbol: string, walletAddress: Address): Promise<IBigFloat>
  getCrossChainTotalFiatBalance(walletAddress: Address): Promise<IBigFloat>

  getTokenAddressListOrderByChainId(): Promise<Record<ChainId, Address[]>>
  getSymbolData(walletAddress?: Address): Promise<ITokenListViewData>
  getToken(chainId: ChainId, address: Address): Promise<IToken | null>
  getTokenById(id: TokenRecordId): Promise<IToken | null>
  getTokenBalanceById(id: TokenRecordId): Promise<IBigFloat>
  getTokenFiatBalanceById(id: TokenRecordId): Promise<IBigFloat>
  getTokenLogoURL(chainId: ChainId, address: Address): Promise<string | null>
  getNativeToken(chainId: ChainId): Promise<IToken | null>
  getTokenBySymbol(chainId: ChainId, symbol: string): Promise<IToken[]>
  getTokenList(chainId: ChainId, addresses: Address[]): Promise<IToken[]>
  getTokenListSortedByPriority(chainId: ChainId, addresses: Address[]): Promise<IToken[]>
  getTokenMap(chainId: ChainId, addresses: Address[]): Promise<Record<Address, IToken>>
  getTokenBalanceMap(
    chainId: ChainId,
    walletAddress: Address,
    addresses: Address[]
  ): Promise<Record<Address, bigint>>
  getTokenBalance(
    chainId: ChainId,
    tokenAddress: Address,
    walletAddress: Address
  ): Promise<IBalancesTokenRecord | null>
  getTokenUSDPrice(chainId: ChainId, tokenAddress: Address): Promise<string>
  getTokenUSDPrices(chainId: ChainId, tokenAddressList: Address[]): Promise<Record<Address, string>>
  getPriorityToken(chainId: ChainId, addresses: Address[]): Promise<IToken>
  setFavoriteState(chainId: ChainId, tokenAddress: Address, state: boolean): Promise<void>
  getAllFavoriteTokenAddresses(chainId: ChainId): Promise<Address[]>
  isSupportedTokenPermit(chainId: ChainId, tokenAddress: Address): Promise<boolean>
  isFavoriteToken(chainId: ChainId, tokenAddress: Address): Promise<boolean>
  liveQuery<T>(querier: () => T | Promise<T>): Observable<T>
}
