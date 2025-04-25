import { CacheActivePromise } from '@1inch-community/core/decorators'
import { lazyAppContext } from '@1inch-community/core/lazy'
import { BigFloat } from '@1inch-community/core/math'
import {
  ChainId,
  getCrossChainTotalFiatBalanceQueryFilters,
  getSymbolDataQueryFilters,
  getTokenBalanceByIdQueryFilters,
  getTokenFiatBalanceByIdQueryFilters,
  getTokenIdListQueryFilters,
  getTotalTokenBalanceBySymbolQueryFilters,
  getTotalTokenFiatBalanceBySymbolQueryFilters,
  IApplicationContext,
  IBalancesTokenRecord,
  IBigFloat,
  ICrossChainTokensBindingRecord,
  IToken,
  ITokenDto,
  ITokenListViewData,
  ITokenPriceRecord,
  ITokenRecord,
  ITokenStorage,
  ITokenV2Dto,
  ProxyResultBalance,
  ProxyResultTokenPrice,
  TokenRecordId,
} from '@1inch-community/models'
import { from, switchMap } from 'rxjs'
import { Address, isAddressEqual } from 'viem'
import { getChainIdList, isChainId, nativeTokenAddress, parseChainId } from '../../chain'
import { buildBalanceId, buildTokenId, buildTokenPriceId, destructuringId } from '../token-id'
import { TokenSchema } from './token.schema'

export class TokenController implements ITokenStorage {
  private readonly context = lazyAppContext('TokenController')
  private readonly schema = new TokenSchema()

  private get oneInchApiAdapter() {
    return this.context.value.api
  }

  async init(context: IApplicationContext): Promise<void> {
    this.context.set(context)
    await this.schema.init(context)
  }

  @CacheActivePromise()
  async getAllFavoriteTokens(): Promise<IToken[]> {
    const { tokens, favoriteTokens } = this.schema
    const favoriteTokenIdSet = new Set<TokenRecordId>()
    await favoriteTokens.each((record) => favoriteTokenIdSet.add(record.id))
    return await tokens
      .orderBy('priority')
      .and((record) => favoriteTokenIdSet.has(record.id))
      .toArray()
  }

  async getAllFavoriteTokenIds(): Promise<TokenRecordId[]> {
    const { tokens, favoriteTokens } = this.schema
    const favoriteTokenIds: TokenRecordId[] = []
    await favoriteTokens.each((record) => favoriteTokenIds.push(record.id))
    const tokensList = await tokens.where('id').anyOf(favoriteTokenIds).toArray()
    return tokensList.map((token) => token.id)
  }

  @CacheActivePromise()
  async changeFavoriteToken(id: TokenRecordId, isFavorite: boolean): Promise<void> {
    const { favoriteTokens } = this.schema
    if (isFavorite) {
      await favoriteTokens.add({ id })
    } else {
      await favoriteTokens.where('id').equals(id).delete()
    }
  }

  @CacheActivePromise()
  async getTotalTokenBalanceBySymbol(filter: getTotalTokenBalanceBySymbolQueryFilters) {
    const { chainIds, symbol, walletAddress } = filter
    await this.updateDatabase(walletAddress)
    const { balances, tokens } = this.schema
    const chainIdSet = new Set(chainIds)
    const tokenMap = new Map<TokenRecordId, IToken>()
    await tokens
      .where('symbol')
      .equals(symbol)
      .each((record) => {
        if (!chainIdSet.has(record.chainId)) return
        tokenMap.set(record.id, record)
      })
    const tokenIdList = tokenMap.keys().toArray()
    let totalBalance = BigFloat.zero()
    await balances
      .where('tokenRecordId')
      .anyOf(tokenIdList)
      .and((record) => isAddressEqual(record.walletAddress, walletAddress))
      .each((record) => {
        const token = tokenMap.get(record.tokenRecordId)
        if (!token) return
        const balance = BigFloat.fromBigInt(BigInt(record.amount), token.decimals)
        totalBalance = totalBalance.add(balance)
      })
    return totalBalance
  }

  @CacheActivePromise()
  async getTotalTokenFiatBalanceBySymbol(filter: getTotalTokenFiatBalanceBySymbolQueryFilters) {
    const { chainIds, symbol, walletAddress } = filter
    await this.updateDatabase(walletAddress)
    const { balances, tokens, tokenPrice } = this.schema
    const chainIdSet = new Set(chainIds)
    const tokenMap = new Map<TokenRecordId, IToken>()
    await tokens
      .where('symbol')
      .equals(symbol)
      .each((record) => {
        if (!chainIdSet.has(record.chainId)) return
        tokenMap.set(record.id, record)
      })
    const tokenIdList = tokenMap.keys().toArray()
    const tokenPriceMap = new Map<TokenRecordId, BigFloat>()
    await tokenPrice
      .where('tokenRecordId')
      .anyOf(tokenIdList)
      .each((record) => tokenPriceMap.set(record.tokenRecordId, BigFloat.fromString(record.price)))
    let totalFiatBalance = BigFloat.zero()
    await balances
      .where('tokenRecordId')
      .anyOf(tokenIdList)
      .each((record) => {
        const token = tokenMap.get(record.tokenRecordId)
        if (!token) return
        const balance = BigFloat.fromBigInt(BigInt(record.amount), token.decimals)
        const fiatPrice = tokenPriceMap.get(record.tokenRecordId)
        if (!fiatPrice) return
        totalFiatBalance = totalFiatBalance.add(balance.mul(fiatPrice))
      })
    return totalFiatBalance
  }

  @CacheActivePromise()
  async getSymbolData(filter: getSymbolDataQueryFilters): Promise<ITokenListViewData> {
    await this.updateDatabase(filter.walletAddress)
    if (filter.walletAddress) {
      return this.getSymbolDataByWalletAddress(filter)
    }
    return this.getSymbolDataWithoutWalletAddress(filter)
  }

  @CacheActivePromise()
  private async getSymbolDataWithoutWalletAddress(
    filter: getSymbolDataQueryFilters
  ): Promise<ITokenListViewData> {
    const { chainIds, tokensOnlyWithBalance } = filter
    if (tokensOnlyWithBalance) {
      throw new Error(
        'getSymbolDataWithoutWalletAddress not supported tokensOnlyWithBalance filter'
      )
    }
    await this.updateDatabase()
    const { crossChainTokensBinding } = this.schema
    const chainIdSet = new Set<ChainId>(chainIds)
    const allTokensInfo: ICrossChainTokensBindingRecord[] = []
    await crossChainTokensBinding
      .orderBy('priority')
      .reverse()
      .each((record) => {
        const tokenRecordIds = record.tokenRecordIds.filter((id) => {
          const [chainIdStr] = destructuringId(id)
          return chainIdSet.has(parseChainId(chainIdStr))
        })
        if (!tokenRecordIds.length) return
        allTokensInfo.push({
          ...record,
          tokenRecordIds,
        })
      })
    return {
      allTokensInfo,
      userTokensInfo: [],
    }
  }

  @CacheActivePromise()
  private async getSymbolDataByWalletAddress(
    filter: getSymbolDataQueryFilters
  ): Promise<ITokenListViewData> {
    const { chainIds, walletAddress, tokensOnlyWithBalance } = filter
    if (walletAddress === null) {
      throw new Error('getSymbolDataByWalletAddress not supported for walletAddress = null')
    }
    await this.updateDatabase(walletAddress)
    const chainIdSet = new Set<ChainId>(chainIds)
    const { balances, tokens, crossChainTokensBinding, tokenPrice } = this.schema
    const crossChainTokensBindingSortedSymbols = crossChainTokensBinding
      .orderBy('priority')
      .reverse()
    const tokenIdsWithBalance: TokenRecordId[] = []
    const tokenSymbolsWithBalance = new Set<string>()
    const tokenRecord: Record<TokenRecordId, ITokenRecord> = {}
    const tokenRateRecord: Record<TokenRecordId, BigFloat> = {}
    const tokenRawBalanceRecord: Record<TokenRecordId, bigint> = {}
    const tokenBalanceRecord: Record<TokenRecordId, BigFloat> = {}
    const tokenFiatBalanceRecord: Record<TokenRecordId, BigFloat> = {}
    const crossChainTokensBindingRecord: Record<string, ICrossChainTokensBindingRecord> = {}
    const crossChainTokensBindingResult: ICrossChainTokensBindingRecord[] = []
    const crossChainTokensBindingWithBalanceResult: ICrossChainTokensBindingRecord[] = []
    await balances
      .where('walletAddress')
      .equals(walletAddress)
      .and((record) => record.amount !== '' && record.amount !== '0')
      .each((record) => {
        tokenIdsWithBalance.push(record.tokenRecordId)
        tokenRawBalanceRecord[record.tokenRecordId] = BigInt(record.amount)
      })
    await tokens
      .where('id')
      .anyOf(tokenIdsWithBalance)
      .filter((record) => chainIdSet.has(record.chainId))
      .each((record) => {
        tokenSymbolsWithBalance.add(record.symbol)
        const balance = tokenRawBalanceRecord[record.id]
        tokenBalanceRecord[record.id] = BigFloat.fromBigInt(balance, record.decimals)
        tokenRecord[record.id] = record
      })
    await crossChainTokensBindingSortedSymbols
      .clone()
      .filter((record) => tokenSymbolsWithBalance.has(record.symbol))
      .each((record) => {
        const tokenRecordIds = record.tokenRecordIds.filter((id) => {
          const [chainIdStr] = destructuringId(id)
          return chainIdSet.has(parseChainId(chainIdStr))
        })
        if (!tokenRecordIds.length) return
        crossChainTokensBindingRecord[record.symbol] = {
          ...record,
          tokenRecordIds,
        }
      })
    await tokenPrice
      .where('tokenRecordId')
      .anyOf(tokenIdsWithBalance)
      .each((record) => {
        tokenRateRecord[record.tokenRecordId] = BigFloat.from(record.price)
      })
    tokenIdsWithBalance.forEach((id) => {
      const rate = tokenRateRecord[id]
      const balance = tokenBalanceRecord[id]
      if (!rate || !balance) return
      tokenFiatBalanceRecord[id] = rate.mul(balance)
    })
    Object.entries(tokenFiatBalanceRecord)
      .sort(([, balance1], [, balance2]) => {
        const result = balance1.sub(balance2)
        if (result.isZero()) return 0
        return result.isNegative() ? 1 : -1
      })
      .forEach(([id]) => {
        const token = tokenRecord[id as TokenRecordId]
        crossChainTokensBindingWithBalanceResult.push(crossChainTokensBindingRecord[token.symbol])
      })
    await crossChainTokensBindingSortedSymbols
      .clone()
      .filter((record) => !tokenSymbolsWithBalance.has(record.symbol))
      .each((record) => {
        const tokenRecordIds = record.tokenRecordIds.filter((id) => {
          const [chainIdStr] = destructuringId(id)
          return chainIdSet.has(parseChainId(chainIdStr))
        })
        if (tokenRecordIds.length && !tokensOnlyWithBalance) {
          crossChainTokensBindingResult.push({
            ...record,
            tokenRecordIds,
          })
        }
      })
    return {
      allTokensInfo: crossChainTokensBindingResult,
      userTokensInfo: crossChainTokensBindingWithBalanceResult,
    }
  }

  @CacheActivePromise()
  async getCrossChainTotalFiatBalance(filter: getCrossChainTotalFiatBalanceQueryFilters) {
    const { chainIds, walletAddress } = filter
    await this.updateDatabase(walletAddress)
    const { balances, tokens, tokenPrice } = this.schema
    const chainIdSet = new Set<ChainId>(chainIds ?? getChainIdList())
    const balanceMap = new Map<TokenRecordId, IBalancesTokenRecord>()
    const tokenPriceMap = new Map<TokenRecordId, ITokenPriceRecord>()
    const tokenMap = new Map<TokenRecordId, IToken>()
    await balances
      .where('walletAddress')
      .equals(walletAddress)
      .each((record) => balanceMap.set(record.tokenRecordId, record))
    const tokenIdList = balanceMap.keys().toArray()
    await Promise.all([
      tokenPrice
        .where('tokenRecordId')
        .anyOf(tokenIdList)
        .each((record) => tokenPriceMap.set(record.tokenRecordId, record)),
      tokens
        .where('id')
        .anyOf(tokenIdList)
        .each((record) => {
          if (!chainIdSet.has(record.chainId)) return
          tokenMap.set(record.id, record)
        }),
    ])
    let totalBalance = BigFloat.zero()
    for (const id of tokenIdList) {
      const token = tokenMap.get(id)
      const balanceRecord = balanceMap.get(id)
      const tokenPriceRecord = tokenPriceMap.get(id)
      if (!token || !balanceRecord || !tokenPriceRecord) continue
      const balance = BigFloat.fromBigInt(BigInt(balanceRecord.amount), token.decimals)
      const tokenPrice = BigFloat.fromString(tokenPriceRecord.price)
      const fiatBalance = balance.mul(tokenPrice)
      totalBalance = totalBalance.add(fiatBalance)
    }
    return totalBalance
  }

  @CacheActivePromise()
  async getCrossChainTokenName(symbol: string) {
    const targetToken = await this.getCrossChainTokenByPriority(symbol)
    return targetToken ? targetToken.name : symbol
  }

  @CacheActivePromise()
  async getCrossChainTokenByPriority(symbol: string) {
    const { tokens, crossChainTokensBinding } = this.schema
    const crossChainTokensBindingRecord = await crossChainTokensBinding
      .where('symbol')
      .equals(symbol)
      .first()
    if (!crossChainTokensBindingRecord) return null
    let targetToken!: ITokenRecord
    await tokens
      .where('id')
      .anyOf(crossChainTokensBindingRecord.tokenRecordIds)
      .each((record) => {
        if (!targetToken || targetToken.priority < record.priority) {
          targetToken = record
        }
      })
    return targetToken ?? null
  }

  @CacheActivePromise()
  async getCrossChainTokenIdListWithBalance(
    chainIds: ChainId[],
    symbol: string,
    walletAddress: Address
  ): Promise<TokenRecordId[]> {
    const { balances, crossChainTokensBinding } = this.schema
    const chainIdSet = new Set(chainIds)
    const crossChainTokensBindingRecord = await crossChainTokensBinding
      .where('symbol')
      .equals(symbol)
      .first()
    if (!crossChainTokensBindingRecord) return []
    const tokenIdSet = new Set(
      crossChainTokensBindingRecord.tokenRecordIds.filter((id) => {
        const [chainIdStr] = destructuringId(id)
        return chainIdSet.has(parseChainId(chainIdStr))
      })
    )
    const result: TokenRecordId[] = []
    await balances
      .where('walletAddress')
      .equals(walletAddress)
      .each((record) => {
        if (record.amount === '0') return
        if (!tokenIdSet.has(record.tokenRecordId)) return
        result.push(record.tokenRecordId)
      })
    return result
  }

  @CacheActivePromise()
  async getTokenIdList(filter: getTokenIdListQueryFilters): Promise<TokenRecordId[]> {
    await this.updateTokenDatabase()
    const { chainIds, tokenNameSymbolAddressMatches, walletAddress, tokensOnlyWithBalance } = filter
    if (walletAddress === null && tokensOnlyWithBalance) {
      throw new Error('tokensOnlyWithBalance is not supported for walletAddress = null')
    }
    const { tokens, balances, tokenPrice } = this.schema
    const chainIdSet = new Set(chainIds)
    const result = new Set<TokenRecordId>()
    const tokenRecordMap = new Map<TokenRecordId, IToken>()
    const searchFilterLower = tokenNameSymbolAddressMatches?.toLowerCase()
    const searchFilterHandler = (value: string) => {
      if (!searchFilterLower) return true
      return value.toLowerCase().startsWith(searchFilterLower)
    }
    await tokens
      .orderBy('priority')
      .and((record) => {
        if (!chainIdSet.has(record.chainId)) return false
        return (
          searchFilterHandler(record.symbol) ||
          searchFilterHandler(record.name) ||
          searchFilterHandler(record.address)
        )
      })
      .reverse()
      .each((record) => tokenRecordMap.set(record.id, record))
    if (walletAddress) {
      const balanceList: [TokenRecordId, BigFloat][] = []
      const fiatBalanceList: [TokenRecordId, BigFloat][] = []
      const tokenIdListWithBalance: TokenRecordId[] = []
      const tokenPriceMap = new Map<TokenRecordId, BigFloat>()
      await balances
        .where('walletAddress')
        .equals(walletAddress.toLowerCase())
        .each((record) => {
          if (record.amount === '0' || !tokenRecordMap.has(record.tokenRecordId)) return
          const token = tokenRecordMap.get(record.tokenRecordId)
          if (!token) return
          tokenIdListWithBalance.push(record.tokenRecordId)
          balanceList.push([
            record.tokenRecordId,
            BigFloat.fromBigInt(BigInt(record.amount), token.decimals),
          ])
        })
      await tokenPrice
        .where('tokenRecordId')
        .anyOf(tokenIdListWithBalance)
        .each((record) =>
          tokenPriceMap.set(record.tokenRecordId, BigFloat.fromString(record.price))
        )
      balanceList.forEach(([id, balance]) => {
        const tokenPrice = tokenPriceMap.get(id)
        if (!tokenPrice) {
          fiatBalanceList.push([id, BigFloat.zero()])
          return
        }
        const fiatBalance = balance.mul(tokenPrice)
        fiatBalanceList.push([id, fiatBalance])
      })
      fiatBalanceList
        .sort(([, fiatBalance1], [, fiatBalance2]) => {
          const result = fiatBalance1.sub(fiatBalance2)
          if (result.isZero()) return 0
          return result.isNegative() ? 1 : -1
        })
        .forEach(([id]) => {
          result.add(id)
        })
    }

    if (!tokensOnlyWithBalance) {
      tokenRecordMap.forEach((_, id) => {
        result.add(id)
      })
    }

    return result.values().toArray()
  }

  async getTokenAddressListOrderByChainId() {
    const { tokens } = this.schema
    const result: Record<ChainId, Address[]> = {} as Record<ChainId, Address[]>

    await tokens.each((record) => {
      if (!result[record.chainId]) {
        result[record.chainId] = []
      }
      result[record.chainId].push(record.address)
    })

    return result
  }

  async getToken(chainId: ChainId, address: Address) {
    await this.updateTokenDatabase()
    const recordId = buildTokenId(chainId, address)
    const records = await this.schema.tokens.where('id').equals(recordId).toArray()
    return records[0] ?? null
  }

  @CacheActivePromise()
  async getTokenById(id: TokenRecordId): Promise<IToken | null> {
    await this.updateTokenDatabase()
    const token = await this.schema.tokens.get(id)
    return token ?? null
  }

  @CacheActivePromise()
  async getTokenBalanceById(filter: getTokenBalanceByIdQueryFilters): Promise<IBigFloat> {
    const { tokenRecordId, walletAddress } = filter
    await this.updateDatabase(walletAddress)
    const { balances } = this.schema
    const token = await this.getTokenById(tokenRecordId)
    if (!token) return BigFloat.zero()
    const balanceRecord = await balances
      .where('tokenRecordId')
      .equals(tokenRecordId)
      .and((record) => isAddressEqual(record.walletAddress, walletAddress))
      .first()
    if (!balanceRecord) return BigFloat.zero()
    return BigFloat.fromBigInt(BigInt(balanceRecord.amount), token.decimals)
  }

  @CacheActivePromise()
  async getTokenFiatBalanceById(filter: getTokenFiatBalanceByIdQueryFilters): Promise<IBigFloat> {
    const { walletAddress, tokenRecordId } = filter
    await this.updateDatabase(walletAddress)
    const { tokenPrice } = this.schema
    const balance = await this.getTokenBalanceById(filter)
    const tokenPriceRecord = await tokenPrice.where('tokenRecordId').equals(tokenRecordId).first()
    if (!tokenPriceRecord) return BigFloat.zero()
    return balance.mul(BigFloat.fromString(tokenPriceRecord.price))
  }

  async getNativeToken(chainId: ChainId) {
    return this.getToken(chainId, nativeTokenAddress)
  }

  async getTokenBySymbol(chainId: ChainId, symbol: string) {
    return this.schema.tokens
      .where('chainId')
      .equals(chainId)
      .filter((record) => record.symbol === symbol)
      .toArray()
  }

  async getTokenList(chainId: ChainId, addresses: Address[]) {
    const addressesSet = new Set(addresses)
    return this.schema.tokens
      .filter((record) => record.chainId === chainId && addressesSet.has(record.address))
      .toArray()
  }

  async getTokenListSortedByPriority(chainId: ChainId, addresses: Address[]) {
    const tokens = await this.getTokenList(chainId, addresses)
    return tokens.sort((token1, token2) => token2.priority - token1.priority)
  }

  async getTokenBalance(chainId: ChainId, tokenAddress: Address, walletAddress: Address) {
    await this.updateDatabase(walletAddress)
    const recordId = buildBalanceId(chainId, walletAddress, tokenAddress)
    const records = await this.schema.balances.where('id').equals(recordId).toArray()
    return records[0] ?? null
  }

  async getTokenUSDPrice(_: ChainId, __: Address) {
    return 'TODO Write me'
  }

  async getTokenLogoURL(chainId: ChainId, tokenAddress: Address) {
    await this.updateTokenDatabase()
    const token = await this.getToken(chainId, tokenAddress)
    return token?.logoURL ?? null
  }

  async getTokenLogoURLsBySymbol(symbol: string): Promise<string[]> {
    await this.updateTokenDatabase()
    const { crossChainTokensBinding, tokens } = this.schema
    const crossChainTokensBindingRecord = await crossChainTokensBinding
      .where('symbol')
      .equals(symbol)
      .first()
    if (!crossChainTokensBindingRecord) return []
    const tokenList: ITokenRecord[] = []
    await tokens
      .where('id')
      .anyOf(crossChainTokensBindingRecord.tokenRecordIds)
      .each((record) => tokenList.push(record))
    return tokenList.sort((r1, r2) => r2.priority - r1.priority).map((record) => record.logoURL)
  }

  async getPriorityToken(chainId: ChainId, addresses: Address[]) {
    const tokens = await this.getTokenList(chainId, addresses)
    const isStable = (token: ITokenRecord) =>
      token.tags.includes('PEG:USD') || token.tags.includes('PEG:EUR')
    return tokens.sort((record1, record2) => {
      const isStable1 = isStable(record1)
      const isStable2 = isStable(record2)
      if (isStable1 && isStable2) {
        return record1.priority - record2.priority
      }
      if (isStable1 && !isStable2) {
        return -1
      }
      if (!isStable1 && isStable2) {
        return 1
      }

      return record1.priority - record2.priority
    })[0]
  }

  // Update store methods

  @CacheActivePromise()
  private async updateDatabase(walletAddress?: Address | null): Promise<void> {
    await this.updateTokenDatabase()
    await Promise.all([this.updateBalanceDatabase(walletAddress), this.updateTokenPrice()])
  }

  @CacheActivePromise()
  private async updateTokenDatabase() {
    if (!this.schema.tokensIsExpired()) return
    const tokens = await this.oneInchApiAdapter.getTokenList()
    await this.setTokens(tokens)
  }

  @CacheActivePromise()
  private async updateBalanceDatabase(walletAddress?: Address | null) {
    if (!walletAddress || !this.schema.balancesIsExpired(walletAddress)) return

    const update = async () => {
      const chainIdList = getChainIdList()
      const balances = await this.oneInchApiAdapter.getBalances(chainIdList, [walletAddress])
      await this.setBalances(balances)
    }

    const isEmpty = await this.schema.balancesIsEmpty(walletAddress)

    if (isEmpty) {
      return await update()
    }
    update().catch(console.error)
  }

  @CacheActivePromise()
  private async updateTokenPrice() {
    const walletConnected = await this.context.value.wallet.data.isConnected()
    if (!this.schema.tokenPriceIsExpired() || !walletConnected) return

    const update = async () => {
      const chainIdList = getChainIdList()
      const tokenPrice = await this.oneInchApiAdapter.getTokenPrice(chainIdList)
      await this.setTokenPrice(tokenPrice)
    }

    const isEmpty = await this.schema.tokenPriceIsEmpty()

    if (isEmpty) {
      return await update()
    }
    update().catch(console.error)
  }

  private async setTokens(tokensDto: ITokenV2Dto[]) {
    const { tokens, crossChainTokensBinding } = this.schema
    const tableTokens: ITokenRecord[] = []
    type crossChainTokensBindingRecord = {
      priority: number
      supportedChainIds: Set<ChainId>
      tokenNames: Set<string>
      tokenAddresses: Set<Address>
      tokenRecordIds: Set<TokenRecordId>
    }
    const crossChainTokensBindingRecordMap = new Map<string, crossChainTokensBindingRecord>()
    for (const token of tokensDto) {
      const chainId = token.chainId
      if (!isChainId(chainId)) {
        continue
      }
      const id = buildTokenId(chainId, token.address)
      const priority = calcTokenPriority(token)
      tableTokens.push({
        id,
        address: token.address.toLowerCase() as Address,
        decimals: token.decimals,
        eip2612: token.eip2612 ?? null,
        name: token.name,
        symbol: token.symbol,
        tags: token.tags,
        logoURL: token.logoURI,
        chainId,
        priority,
      })
      if (!crossChainTokensBindingRecordMap.has(token.symbol)) {
        crossChainTokensBindingRecordMap.set(token.symbol, {
          priority: 0,
          supportedChainIds: new Set(),
          tokenNames: new Set(),
          tokenAddresses: new Set(),
          tokenRecordIds: new Set(),
        })
      }
      const record = crossChainTokensBindingRecordMap.get(token.symbol)!
      if (record.tokenRecordIds.has(id)) {
        throw new Error('violation of communication integrity')
      }
      record.priority += priority
      record.supportedChainIds.add(chainId)
      record.tokenNames.add(token.name)
      record.tokenAddresses.add(token.address.toLowerCase() as Address)
      record.tokenRecordIds.add(id)
    }

    const crossChainTokensBindingTable: ICrossChainTokensBindingRecord[] = []

    for (const [symbol, record] of crossChainTokensBindingRecordMap) {
      crossChainTokensBindingTable.push({
        symbol,
        priority: record.priority,
        tokenRecordIds: record.tokenRecordIds.values().toArray(),
        tokenAddresses: record.tokenAddresses.values().toArray(),
        supportedChainIds: record.supportedChainIds.values().toArray(),
        tokenNames: record.tokenNames.values().toArray(),
      })
    }

    await Promise.all([
      tokens.bulkPut(tableTokens),
      crossChainTokensBinding.bulkPut(crossChainTokensBindingTable),
    ])
    this.schema.updateTokensComplete()
  }

  async setBalances(balancesDto: ProxyResultBalance) {
    const { balances } = this.schema
    const balancesRecords: IBalancesTokenRecord[] = []
    const walletAddressSet = new Set<Address>()

    for (const balance of balancesDto) {
      if (balance.error) {
        this.context.value.logger.error(balance.error)
        continue
      }
      const [chainIdStr, walletAddress]: [string, Address] = destructuringId(balance.id)
      const chainId = parseChainId(chainIdStr)
      const balanceRecord = balance.result!
      for (const address in balanceRecord) {
        const tokenAddress = address.toLowerCase() as Address
        balancesRecords.push({
          id: buildBalanceId(chainId, walletAddress, tokenAddress),
          tokenRecordId: buildTokenId(chainId, tokenAddress),
          chainId,
          tokenAddress: tokenAddress,
          walletAddress: walletAddress.toLowerCase() as Address,
          amount: balanceRecord[tokenAddress],
        })
      }
      walletAddressSet.add(walletAddress)
    }
    await balances.bulkPut(balancesRecords)
    for (const walletAddress of walletAddressSet) {
      this.schema.updateBalancesComplete(walletAddress)
    }
  }

  async setTokenPrice(tokenPriceDto: ProxyResultTokenPrice): Promise<void> {
    const { tokenPrice } = this.schema
    const tokenPriceRecords: ITokenPriceRecord[] = []
    for (const price of tokenPriceDto) {
      if (price.error) {
        this.context.value.logger.error(price.error)
        continue
      }
      const chainId = parseChainId(price.id)
      const tokenPriceRecord = price.result!
      for (const address in tokenPriceRecord) {
        const tokenAddress = address as Address
        tokenPriceRecords.push({
          id: buildTokenPriceId(chainId, tokenAddress),
          tokenRecordId: buildTokenId(chainId, tokenAddress),
          chainId,
          price: tokenPriceRecord[tokenAddress],
        })
      }
    }
    await tokenPrice.bulkPut(tokenPriceRecords)
    this.schema.updateTokenPriceComplete()
  }

  liveQuery<T>(querier: () => T | Promise<T>) {
    return from(import('dexie')).pipe(switchMap((dexie) => dexie.liveQuery<T>(querier)))
  }
}

const TokenPriority: Record<string, number> = {
  native: 1000,
  USDT: 100,
  USDC: 100,
  crosschain: 70,
  WETH: 62,
  '1INCH': 61,
  'PEG:ETH': 60,
  'PEG:USD': 50,
  'PEG:BTC': 40,
  'PEG:EUR': 30,
  staking: 20,
  savings: 10,
}

function calcTokenPriority(dto: ITokenDto): number {
  let priority = dto.providers?.length ?? 0
  priority += TokenPriority[dto.symbol] ?? 0
  for (const tag of dto.tags) {
    priority += TokenPriority[tag] ?? 0
  }
  return priority
}
