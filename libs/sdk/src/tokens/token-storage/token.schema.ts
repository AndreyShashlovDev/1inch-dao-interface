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
  ITokenPriceRecord,
  ITokenRecord,
  TokenRecordId,
} from '@1inch-community/models'
import type { Table } from 'dexie'
import { type Address } from 'viem'
import { nativeTokenAddress } from '../../chain'
import { buildBalanceId, buildTokenId } from '../token-id'

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

  tokensIsExpired() {
    return this.tokensTTL.isExpired()
  }

  balancesIsExpired(walletAddress: Address) {
    return this.balancesTTL.isExpired(walletAddress)
  }

  tokenPriceIsExpired() {
    return this.tokenPriceTTL.isExpired()
  }

  async balancesIsEmpty(walletAddress: Address) {
    const count = await this.balances.where('walletAddress').equals(walletAddress).count()
    return count === 0
  }

  async tokenPriceIsEmpty() {
    const count = await this.tokenPrice.count()
    return count === 0
  }

  resetTokensTTL() {
    this.tokensTTL.reset()
  }

  resetBalancesTTL(walletAddress: Address) {
    this.balancesTTL.reset(walletAddress)
  }

  resetTokenPriceTTL() {
    this.tokenPriceTTL.reset()
  }

  // depr

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

  async getTokenBalance(
    chainId: ChainId,
    tokenAddress: Address,
    walletAddress: Address
  ): Promise<IBalancesTokenRecord | null> {
    const recordId = buildBalanceId(chainId, walletAddress, tokenAddress)
    const records = await this.balances.where('id').equals(recordId).toArray()
    return records[0] ?? null
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

function buildTTLStorageName(prefix: string) {
  return `${TokenSchema.databaseName}:${TokenSchema.databaseVersion}:${prefix}`
}
