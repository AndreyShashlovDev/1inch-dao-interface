import { buildDatabaseSchema } from '@1inch-community/core/database'
import { TtlMapStorage, TTLStorage } from '@1inch-community/core/storage'
import { lazyAppContext } from '@1inch-community/core/utils'
import {
  BalanceTokenRecordId,
  ChainId,
  IApplicationContext,
  IBalancesTokenRecord,
  ICrossChainTokensBindingRecord,
  InitializingEntity,
  ITokenDto,
  ITokenPriceRecord,
  ITokenRecord,
  ITokenV2Dto,
  ProxyResultBalance,
  ProxyResultTokenPrice,
  TokenRecordId,
} from '@1inch-community/models'
import type { Table } from 'dexie'
import { type Address, isAddressEqual } from 'viem'
import { nativeTokenAddress, parseChainId } from '../../chain'
import { buildBalanceId, buildTokenId, buildTokenPriceId, destructuringId } from '../token-id'

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

interface TokenSchemaDatabase {
  readonly tokens: Table<ITokenRecord, TokenRecordId>
  readonly balances: Table<IBalancesTokenRecord, BalanceTokenRecordId>
  readonly tokenPrice: Table<ITokenPriceRecord, TokenRecordId>
  readonly crossChainTokensBinding: Table<ICrossChainTokensBindingRecord, string>
}

export class TokenSchema implements InitializingEntity, TokenSchemaDatabase {
  static databaseVersion = 5
  static databaseName = 'one-inch-token'

  private database?: TokenSchemaDatabase

  private readonly context = lazyAppContext('TokenSchema')

  private readonly tokensTTL = new TTLStorage(
    buildTTLStorageName('tokens'),
    6.048e8 as const // week,
  )

  private readonly balancesTTL = new TtlMapStorage<Address>(buildTTLStorageName('balances'), 12000)

  private readonly tokenPriceTTL = new TTLStorage(buildTTLStorageName('tokenPrice'), 12000)

  get tokens() {
    if (!this.database) throw new Error('token database not init')
    return this.database.tokens
  }

  get balances() {
    if (!this.database) throw new Error('token database not init')
    return this.database.balances
  }

  get tokenPrice() {
    if (!this.database) throw new Error('token database not init')
    return this.database.tokenPrice
  }

  get crossChainTokensBinding() {
    if (!this.database) throw new Error('token database not init')
    return this.database.crossChainTokensBinding
  }

  tokensIsExpired() {
    return this.tokensTTL.isExpired()
  }

  balancesIsExpired(walletAddress: Address) {
    return this.balancesTTL.isExpired(walletAddress)
  }

  tokenPriceIsExpired() {
    return this.tokenPriceTTL.isExpired()
  }

  async init(context: IApplicationContext) {
    this.context.set(context)
    const [Dexie] = await Promise.all([
      import('dexie').then((m) => m.Dexie),
      this.tokensTTL.init(context),
      this.balancesTTL.init(context),
      this.tokenPriceTTL.init(context),
    ])
    const db = new Dexie(TokenSchema.databaseName)
    db.version(TokenSchema.databaseVersion).stores({
      tokens: buildDatabaseSchema<ITokenRecord>(
        '&id',
        'address',
        'decimals',
        'chainId',
        'name',
        'symbol',
        '*tags',
        'eip2612',
        'logoURL',
        'isFavorite',
        'priority'
      ),
      balances: buildDatabaseSchema<IBalancesTokenRecord>(
        '&id',
        'tokenRecordId',
        'chainId',
        'tokenAddress',
        'walletAddress',
        'amount'
      ),
      tokenPrice: buildDatabaseSchema<ITokenPriceRecord>(
        '&id',
        'tokenRecordId',
        'chainId',
        'price'
      ),
      crossChainTokensBinding: buildDatabaseSchema<ICrossChainTokensBindingRecord>(
        '&symbol',
        '*tokenRecordIds',
        'priority'
      ),
    })
    this.database = db as unknown as TokenSchemaDatabase
  }

  async getZeroBalanceChainId(walletAddress: Address): Promise<ChainId[]> {
    const result: ChainId[] = []
    await this.balances
      .where('walletAddress')
      .equals(walletAddress)
      .each((record) => {})
    return result
  }

  async getToken(chainId: ChainId, address: Address): Promise<ITokenRecord | null> {
    const recordId = buildTokenId(chainId, address)
    const records = await this.tokens.where('id').equals(recordId).toArray()
    return records[0] ?? null
  }

  async getNativeToken(chainId: ChainId) {
    return this.getToken(chainId, nativeTokenAddress)
  }

  getTokenBySymbol(chainId: ChainId, symbol: string) {
    return this.tokens
      .where('chainId')
      .equals(chainId)
      .filter((record) => record.symbol === symbol)
      .toArray()
  }

  async getTokenMap(
    chainId: ChainId,
    addresses: Address[]
  ): Promise<Record<Address, ITokenRecord>> {
    const addressesSet = new Set(addresses)
    const result: Record<Address, ITokenRecord> = {}
    await this.tokens.each((record) => {
      if (record.chainId === chainId && addressesSet.has(record.address)) {
        result[record.address] = record
      }
    })

    return result
  }

  getTokenList(chainId: ChainId, addresses: Address[]): Promise<ITokenRecord[]> {
    const addressesSet = new Set(addresses)
    return this.tokens
      .filter((record) => record.chainId === chainId && addressesSet.has(record.address))
      .toArray()
  }

  async getTokenBalanceMap(
    chainId: ChainId,
    walletAddress: Address,
    addresses: Address[]
  ): Promise<Record<Address, bigint>> {
    const addressesSet = new Set(addresses)
    const result: Record<Address, bigint> = {}

    await this.balances.each((record) => {
      if (
        record.chainId === chainId &&
        record.walletAddress === walletAddress &&
        addressesSet.has(record.tokenAddress)
      ) {
        result[record.tokenAddress] = BigInt(record.amount)
      }
    })

    return result
  }

  async getTokens(chainId: ChainId, addresses: Address[]): Promise<ITokenRecord[]> {
    const addressesSet = new Set(addresses)
    return this.tokens
      .filter((record) => record.chainId === chainId && addressesSet.has(record.address))
      .toArray()
  }

  async getAllTokenAddresses(chainId: ChainId) {
    const result: Address[] = []
    await this.tokens
      .where('chainId')
      .equals(chainId)
      .each((record) => result.push(record.address))

    return result
  }

  async getTokenBalance(
    chainId: ChainId,
    tokenAddress: Address,
    walletAddress: Address
  ): Promise<IBalancesTokenRecord | null> {
    const recordId = buildBalanceId(chainId, walletAddress, tokenAddress)
    const records = await this.balances.where('id').equals(recordId).toArray()
    return records[0] ?? null
  }

  async isEmptyTokenBalanceStorage(chainId: ChainId, walletAddress: Address) {
    return this.balances
      .filter(
        (record) =>
          record.chainId === chainId && isAddressEqual(record.walletAddress, walletAddress)
      )
      .toArray()
      .then((list) => list.length === 0)
  }

  async setTokens(tokens: ITokenV2Dto[]) {
    const tableTokens: ITokenRecord[] = []
    const crossChainTokensBindingMap = new Map<string, Set<TokenRecordId>>()
    const crossChainTokensBindingPriorityMap = new Map<string, number>()
    for (const token of tokens) {
      const chainId = token.chainId
      const id = buildTokenId(chainId, token.address)
      const priority = calcTokenPriority(token)
      tableTokens.push({
        id,
        address: token.address,
        decimals: token.decimals,
        eip2612: token.eip2612 ?? null,
        name: token.name,
        symbol: token.symbol,
        tags: token.tags,
        logoURL: token.logoURI,
        isFavorite: false,
        chainId,
        priority,
      })
      if (!crossChainTokensBindingMap.has(token.symbol)) {
        crossChainTokensBindingMap.set(token.symbol, new Set())
      }
      if (crossChainTokensBindingMap.get(token.symbol)?.has(id)) {
        throw new Error('violation of communication integrity')
      }
      crossChainTokensBindingMap.get(token.symbol)!.add(id)
      const crossChainTokensBindingPriority =
        crossChainTokensBindingPriorityMap.get(token.symbol) ?? 0
      crossChainTokensBindingPriorityMap.set(
        token.symbol,
        crossChainTokensBindingPriority + priority
      )
    }

    const crossChainTokensBindingTable: ICrossChainTokensBindingRecord[] = []

    for (const [symbol, tokenRecordIds] of crossChainTokensBindingMap) {
      crossChainTokensBindingTable.push({
        symbol,
        tokenRecordIds: [...tokenRecordIds],
        priority: crossChainTokensBindingPriorityMap.get(symbol) ?? 0,
      })
    }

    await Promise.all([
      this.tokens.bulkPut(tableTokens),
      this.crossChainTokensBinding.bulkPut(crossChainTokensBindingTable),
    ])
    this.tokensTTL.reset()
  }

  async setBalances(balances: ProxyResultBalance) {
    const balancesRecords: IBalancesTokenRecord[] = []
    const walletAddressSet = new Set<Address>()

    for (const balance of balances) {
      if (balance.error) {
        this.context.value.logger.error(balance.error)
        continue
      }
      const [chainIdStr, walletAddress]: [string, Address] = destructuringId(balance.id)
      const chainId = parseChainId(chainIdStr)
      const balanceRecord = balance.result!
      for (const address in balanceRecord) {
        const tokenAddress = address as Address
        balancesRecords.push({
          id: buildBalanceId(chainId, walletAddress, tokenAddress),
          tokenRecordId: buildTokenId(chainId, tokenAddress),
          chainId,
          tokenAddress: tokenAddress,
          walletAddress,
          amount: balanceRecord[tokenAddress],
        })
      }
      walletAddressSet.add(walletAddress)
    }
    await this.balances.bulkPut(balancesRecords)
    for (const walletAddress of walletAddressSet) {
      this.balancesTTL.reset(walletAddress)
    }
  }

  async setTokenPrice(tokenPrice: ProxyResultTokenPrice): Promise<void> {
    const tokenPriceRecords: ITokenPriceRecord[] = []
    for (const price of tokenPrice) {
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
    await this.tokenPrice.bulkPut(tokenPriceRecords)
    this.tokenPriceTTL.reset()
  }

  async getAllFavoriteTokenAddresses(chainId: ChainId) {
    const result: Address[] = []
    await this.tokens
      .where('chainId')
      .equals(chainId)
      .each((record) => {
        if (!record.isFavorite) return
        result.push(record.address)
      })

    return result
  }

  async setFavoriteState(chainId: ChainId, tokenAddress: Address, state: boolean) {
    const recordId = buildTokenId(chainId, tokenAddress)
    await this.tokens.update(recordId, { isFavorite: state })
  }

  async setEip2612Support(chainId: ChainId, address: Address, state: boolean) {
    const recordId = buildTokenId(chainId, address)
    await this.tokens.update(recordId, { eip2612: state })
  }

  async getTokenAddressListOrderByChainId(): Promise<Record<ChainId, Address[]>> {
    const result: Record<ChainId, Address[]> = {} as Record<ChainId, Address[]>

    await this.tokens.each((record) => {
      if (!result[record.chainId]) {
        result[record.chainId] = []
      }
      result[record.chainId].push(record.address)
    })

    return result
  }
}

function calcTokenPriority(dto: ITokenDto): number {
  let priority = dto.providers?.length ?? 0
  priority += TokenPriority[dto.symbol] ?? 0
  for (const tag of dto.tags) {
    priority += TokenPriority[tag] ?? 0
  }
  return priority
}

function buildTTLStorageName(prefix: string) {
  return `${TokenSchema.databaseName}:${TokenSchema.databaseVersion}:${prefix}`
}
