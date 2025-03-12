import { TimeCache } from '@1inch-community/core/cache'
import { CacheActivePromise } from '@1inch-community/core/decorators'
import { TTLStorage } from '@1inch-community/core/storage'
import {
  ChainId,
  IApplicationContext,
  IOneInchDevPortalCrossChainAdapter,
  ITokenRecord,
  ITokenStorage,
} from '@1inch-community/models'
import { liveQuery } from 'dexie'
import { defer } from 'rxjs'
import { Address, formatUnits } from 'viem'
import { averageBlockTime } from '../chain/average-block-time'
import { parseChainId } from '../chain/is-chain-id'
import { TokenSchema } from './token.schema'

const tokenDatabaseUpdateTTLKey = 'token-database-update-ttl-v' + TokenSchema.databaseVersion
const allBalanceDatabaseUpdateTTLKey =
  'all-balance-database-update-ttl-v' + TokenSchema.databaseVersion
const tokenBalanceDatabaseUpdateTTLKey =
  'token-balance-database-update-ttl-v' + TokenSchema.databaseVersion

const tokenDatabaseTTL = 6.048e8 as const // week

export class TokenController implements ITokenStorage {
  private context!: IApplicationContext
  private oneInchApiAdapter!: IOneInchDevPortalCrossChainAdapter
  private readonly schema = new TokenSchema()
  private readonly tokenUpdateTTL = new TTLStorage<ChainId>(
    tokenDatabaseUpdateTTLKey,
    tokenDatabaseTTL
  )
  private readonly allBalanceUpdateTTL = new TTLStorage<string, ChainId>(
    allBalanceDatabaseUpdateTTLKey,
    (chainId) => averageBlockTime[chainId]
  )

  private readonly tokenPriceCache = new TimeCache<ChainId, Record<Address, string>>(20000)

  async init(context: IApplicationContext): Promise<void> {
    this.context = context
    this.oneInchApiAdapter = context.api
    this.tokenUpdateTTL.init(context)
    this.allBalanceUpdateTTL.init(context)
    await this.schema.init()
  }

  /**
   * Retrieves sorted by balances and priority token addresses.
   *
   * @param {ChainId} chainId - The ID of the chain.
   * @param {String} [filterPattern] - pattern for find token buy name or address
   * @param {Address} [walletAddress] - The connected wallet address. (Optional)
   * @returns {Promise<Address[]>} - A promise that resolves to an array of sorted token addresses.
   */
  async getSortedByPriorityAndBalanceTokenAddresses(
    chainId: ChainId,
    filterPattern: string,
    walletAddress?: Address
  ): Promise<Address[]> {
    await this.updateTokenDatabase(chainId)
    if (walletAddress) {
      await this.updateBalanceDatabase(chainId, walletAddress)
    }
    const result = await this.schema.getSortedByPriorityAndBalanceTokenAddresses(
      chainId,
      filterPattern,
      walletAddress
    )
    if (walletAddress) {
      const prices = await this.getTokenUSDPrices(chainId, result.notZero)
      const tokens = await this.getTokenMap(chainId, result.notZero)
      const balances = await this.getTokenBalanceMap(chainId, walletAddress, result.notZero)
      const favoriteTokenList = await this.getAllFavoriteTokenAddresses(chainId)
      const favoriteTokenSet = new Set(favoriteTokenList)
      const tokenAmount: Record<Address, number> = {}
      for (const address of result.notZero) {
        const token = tokens[address]
        const tokenPrice = prices[address]
        const balance = formatUnits(balances[address], token.decimals)
        tokenAmount[address] = Number(balance) * Number(tokenPrice)
      }
      return [
        ...result.notZero.sort((address1, address2) => {
          const isFavoriteToken1 = favoriteTokenSet.has(address1)
          const isFavoriteToken2 = favoriteTokenSet.has(address2)
          if (isFavoriteToken1 === isFavoriteToken2) {
            return tokenAmount[address2] - tokenAmount[address1]
          }
          if (isFavoriteToken1) {
            return -1
          }
          return 1
        }),
        ...result.zero,
      ]
    }
    return [...result.notZero, ...result.zero]
  }

  isSupportedTokenPermit(chainId: ChainId, tokenAddress: Address): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  async getTokenAddressListOrderByChainId(chainIds: ChainId[]) {
    return await this.schema.getTokenAddressListOrderByChainId(chainIds)
  }

  async getToken(chainId: ChainId, address: Address) {
    await this.updateTokenDatabase(chainId)
    return await this.schema.getToken(chainId, address)
  }

  async getNativeToken(chainId: ChainId) {
    await this.updateTokenDatabase(chainId)
    return await this.schema.getNativeToken(chainId)
  }

  async getTokenBySymbol(chainId: ChainId, symbol: string) {
    await this.updateTokenDatabase(chainId)
    return this.schema.getTokenBySymbol(chainId, symbol)
  }

  async getTokenList(chainId: ChainId, addresses: Address[]) {
    await this.updateTokenDatabase(chainId)
    return await this.schema.getTokenList(chainId, addresses)
  }

  async getTokenListSortedByPriority(chainId: ChainId, addresses: Address[]) {
    const tokens = await this.getTokenList(chainId, addresses)
    return tokens.sort((token1, token2) => token2.priority - token1.priority)
  }

  async getTokenMap(chainId: ChainId, addresses: Address[]) {
    return await this.schema.getTokenMap(chainId, addresses)
  }

  async getTokenBalanceMap(chainId: ChainId, walletAddress: Address, addresses: Address[]) {
    await this.updateBalanceDatabase(chainId, walletAddress)
    return await this.schema.getTokenBalanceMap(chainId, walletAddress, addresses)
  }

  async getTokenBalance(chainId: ChainId, tokenAddress: Address, walletAddress: Address) {
    await this.updateBalanceDatabase(chainId, walletAddress, tokenAddress)
    return await this.schema.getTokenBalance(chainId, tokenAddress, walletAddress)
  }

  async getTokenUSDPrice(chainId: ChainId, tokenAddress: Address) {
    const result = await this.getTokenUSDPrices(chainId, [tokenAddress])
    return result[tokenAddress]
  }

  async isFavoriteToken(chainId: ChainId, tokenAddress: Address) {
    const token = await this.getToken(chainId, tokenAddress)
    return token?.isFavorite ?? false
  }

  async getTokenLogoURL(chainId: ChainId, tokenAddress: Address) {
    const token = await this.getToken(chainId, tokenAddress)
    return token?.logoURL ?? null
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

  async setFavoriteState(chainId: ChainId, tokenAddress: Address, state: boolean) {
    await this.schema.setFavoriteState(chainId, tokenAddress, state)
  }

  async getAllFavoriteTokenAddresses(chainId: ChainId) {
    return await this.schema.getAllFavoriteTokenAddresses(chainId)
  }

  async getTokenUSDPrices(
    chainId: ChainId,
    tokenAddressList: Address[]
  ): Promise<Record<Address, string>> {
    const result: Record<Address, string> = {}
    let priceRecord: Record<Address, string>

    if (this.tokenPriceCache.has(chainId)) {
      priceRecord = this.tokenPriceCache.get(chainId)!
    } else {
      const prices = await this.oneInchApiAdapter.getTokenPrice().catch(() => null)
      if (prices === null) {
        return {}
      }
      const pricesByChain = prices.find((record) => parseChainId(record.id) === chainId)
      if (!pricesByChain || !pricesByChain.result) {
        return {}
      }
      priceRecord = pricesByChain.result
      this.tokenPriceCache.set(chainId, priceRecord)
    }

    for (const address of tokenAddressList) {
      result[address] = priceRecord[address] ?? '0'
    }
    return result
  }

  /**
   * Updates the token database for the given chain ID.
   * If the last update time is within the token database TTL, no update is performed.
   * Otherwise, retrieves a list of whitelisted tokens from the 1inch dev portal
   * and sets the tokens using the schema. Updates the last update time in the storage.
   *
   * @param {ChainId} chainId - The chain ID for which the token database should be updated.
   * @return {Promise<void>} - A Promise that resolves when the token database has been updated.
   */
  @CacheActivePromise()
  async updateTokenDatabase(chainId: ChainId): Promise<void> {
    if (!this.tokenUpdateTTL.isExpired(chainId)) return
    const tokens = await this.oneInchApiAdapter.getTokenList()
    await this.schema.setTokens(tokens)
    this.tokenUpdateTTL.update(chainId)
  }

  /**
   * Updates the balance database for a given chain and wallet address.
   *
   * @param {ChainId} chainId - The ID of the chain.
   * @param {Address} walletAddress - The wallet address.
   * @param {Address} tokenAddress - The token address.
   *
   * @return {Promise<void>} - A Promise that resolves once the balance database is updated.
   */
  @CacheActivePromise()
  async updateBalanceDatabase(
    chainId: ChainId,
    walletAddress: Address,
    tokenAddress?: Address
  ): Promise<void> {
    if (tokenAddress) {
      const balance = await this.oneInchApiAdapter.getTokenBalances(
        chainId,
        walletAddress,
        tokenAddress
      )
      await this.schema.setBalances(chainId, walletAddress, { [tokenAddress]: balance.toString() })
      return
    }

    const id = [chainId, walletAddress].join(':')
    if (!this.allBalanceUpdateTTL.isExpired(id, chainId)) return

    const result = await this.oneInchApiAdapter
      .getBalances([chainId], [walletAddress])
      .catch(() => null)
    if (result === null) return
    if (result.length > 1)
      throw new Error(
        'Violation of the consistency of the API response to the balance update request'
      )
    const balances = result[0].result
    if (balances === null) return
    await this.schema.setBalances(chainId, walletAddress, balances)
    this.allBalanceUpdateTTL.update(id)
  }

  liveQuery<T>(querier: () => T | Promise<T>) {
    return defer(() => liveQuery(querier))
  }
}
