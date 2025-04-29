import type { Observable } from 'rxjs'
import type { Address } from 'viem'
import type { InitializingEntity } from '../base'
import type { IBigFloat } from '../big-float'
import type { ChainId } from '../chain'
import type { IBalancesTokenRecord, TokenRecordId } from '../database'
import type { QueryFilters } from './query-type'
import type { IToken } from './token'
import type { ITokenListViewData } from './token-list-view-data'

export type getTokenIdListQueryFilters = QueryFilters<
  'chainIds' | 'tokensOnlyWithBalance',
  'tokenNameSymbolAddressMatches' | 'walletAddress'
>

export type getSymbolDataQueryFilters = QueryFilters<
  'chainIds' | 'tokensOnlyWithBalance',
  'walletAddress'
>

export type getTotalTokenBalanceBySymbolQueryFilters = QueryFilters<
  'chainIds' | 'symbol' | 'walletAddress'
>

export type getTotalTokenFiatBalanceBySymbolQueryFilters = QueryFilters<
  'chainIds' | 'symbol' | 'walletAddress'
>

export type getTokenBalanceByIdQueryFilters = QueryFilters<'tokenRecordId' | 'walletAddress'>

export type getTokenFiatBalanceByIdQueryFilters = QueryFilters<'tokenRecordId' | 'walletAddress'>

export type getCrossChainTotalFiatBalanceQueryFilters = QueryFilters<'walletAddress', 'chainIds'>

export interface ITokenStorage extends InitializingEntity {
  tokensUpdate$: Observable<void>
  balancesUpdate$: Observable<Address>
  tokenPriceUpdate$: Observable<void>
  favoriteTokensUpdate$: Observable<void>

  getTokenIdList(filter: getTokenIdListQueryFilters): Promise<TokenRecordId[]>
  getSymbolData(filter: getSymbolDataQueryFilters): Promise<ITokenListViewData>
  getCrossChainTotalFiatBalance(
    filter: getCrossChainTotalFiatBalanceQueryFilters
  ): Promise<IBigFloat>
  getTotalTokenBalanceBySymbol(filter: getTotalTokenBalanceBySymbolQueryFilters): Promise<IBigFloat>
  getTotalTokenFiatBalanceBySymbol(
    filter: getTotalTokenFiatBalanceBySymbolQueryFilters
  ): Promise<IBigFloat>
  getTokenBalanceById(filter: getTokenBalanceByIdQueryFilters): Promise<IBigFloat>
  getTokenFiatBalanceById(filter: getTokenFiatBalanceByIdQueryFilters): Promise<IBigFloat>
  //

  getCrossChainTokenName(symbol: string): Promise<string>
  getCrossChainTokenIdListWithBalance(
    chainIds: ChainId[],
    symbol: string,
    walletAddress: Address
  ): Promise<TokenRecordId[]>
  getTokenAddressListOrderByChainId(): Promise<Record<ChainId, Address[]>>
  getToken(chainId: ChainId, address: Address): Promise<IToken | null>
  getTokenById(id: TokenRecordId): Promise<IToken | null>
  getTokenLogoURL(chainId: ChainId, address: Address): Promise<string | null>
  getTokenLogoURLsBySymbol(symbol: string): Promise<string[]>
  getNativeToken(chainId: ChainId): Promise<IToken | null>
  getTokenBySymbol(chainId: ChainId, symbol: string): Promise<IToken[]>
  getTokenList(chainId: ChainId, addresses: Address[]): Promise<IToken[]>
  getTokenListSortedByPriority(chainId: ChainId, addresses: Address[]): Promise<IToken[]>
  getTokenBalance(
    chainId: ChainId,
    tokenAddress: Address,
    walletAddress: Address
  ): Promise<IBalancesTokenRecord | null>
  getTokenUSDPrice(chainId: ChainId, tokenAddress: Address): Promise<string>
  getPriorityToken(chainId: ChainId, addresses: Address[]): Promise<IToken>
  liveQuery<T>(querier: () => T | Promise<T>): Observable<T>

  // favorite tokens
  getAllFavoriteTokens(): Promise<IToken[]>
  getAllFavoriteTokenIds(): Promise<TokenRecordId[]>
  changeFavoriteToken(id: TokenRecordId, isFavorite: boolean): Promise<void>
}
