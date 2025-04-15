import { CacheActivePromise } from '@1inch-community/core/decorators'
import { lazyAppContext } from '@1inch-community/core/lazy'
import { ChainId, IApplicationContext, IOnChain } from '@1inch-community/models'
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  from,
  fromEvent,
  map,
  merge,
  Observable,
  shareReplay,
  startWith,
  switchMap,
  take,
  timer,
} from 'rxjs'
import {
  Address,
  Block,
  BlockTag,
  createPublicClient,
  Hash,
  maxUint256,
  parseAbi,
  PublicClient,
  Transaction,
  type WriteContractParameters,
} from 'viem'
import { averageBlockTime } from './average-block-time'
import { BlockTimeCache } from './block-time-cache'
import { getWrapperNativeTokenAddress } from './contracts'
import { isNativeToken } from './is-native-token'
import { WebFallbackTransportController } from './transport/web-fallback-transport.controller'
import { getChainById } from './viem-chain-map'

interface ClientRecord {
  client: PublicClient
  transportController: WebFallbackTransportController
}

const abi = parseAbi([
  'function allowance(address owner, address spender) public view returns (uint256)',
  'function approve(address _spender, uint256 _value) public returns (bool success)',
  'function deposit() public payable',
])

export class OnChainManager implements IOnChain {
  private readonly context = lazyAppContext('OnChainManager')
  private readonly clientMap = new Map<ChainId, ClientRecord>()
  private readonly blockEmitterMap = new Map<ChainId, Observable<Block>>()
  private readonly allowanceCache = new BlockTimeCache<string, bigint>()

  get crossChainEmitter() {
    return this.getBlockEmitter(ChainId.eth).pipe(map(() => void 0))
  }

  async init(context: IApplicationContext): Promise<void> {
    this.context.set(context)
  }

  getBlockEmitter(chainId: ChainId): Observable<Block> {
    if (this.blockEmitterMap.has(chainId)) {
      return this.blockEmitterMap.get(chainId)!
    }
    return this.buildBlockEmitter(chainId)
  }

  @CacheActivePromise()
  async getClient(chainId: ChainId): Promise<PublicClient> {
    if (this.clientMap.has(chainId)) {
      return this.clientMap.get(chainId)!.client
    }
    return await this.buildClient(chainId)
  }

  @CacheActivePromise()
  async estimateWrapNativeToken(chainId: ChainId, value: bigint): Promise<bigint> {
    const client = await this.getClient(chainId)
    const address = getWrapperNativeTokenAddress(chainId)
    return await client.estimateContractGas({
      abi,
      address,
      value,
      functionName: 'deposit',
    })
  }

  @CacheActivePromise()
  async simulateWrapNativeToken(chainId: ChainId, value: bigint): Promise<WriteContractParameters> {
    const client = await this.getClient(chainId)
    const address = getWrapperNativeTokenAddress(chainId)
    const result = await client.simulateContract({
      abi,
      address,
      value,
      functionName: 'deposit',
    })
    return result.request as WriteContractParameters
  }

  @CacheActivePromise()
  async waitTransaction(
    chainId: ChainId,
    hash: Hash,
    blockTag: BlockTag = 'latest'
  ): Promise<Transaction> {
    const client = await this.getClient(chainId)
    const stream = this.getBlockEmitter(chainId).pipe(
      switchMap(async () => {
        const tx = await client.getTransaction({ hash, blockTag } as any)
        if (tx.blockNumber) {
          return tx
        }
        return null
      }),
      filter((tx) => tx !== null),
      take(1)
    )
    return firstValueFrom(stream)
  }

  @CacheActivePromise()
  async getAllowance(
    chainId: ChainId,
    token: Address,
    owner: Address,
    spender: Address
  ): Promise<bigint> {
    if (isNativeToken(token)) {
      return maxUint256
    }
    const id = [chainId, token, owner, spender].join(':')
    const cachedValue = this.allowanceCache.get(chainId, id)
    if (cachedValue !== null) {
      return cachedValue
    }
    const client = await this.getClient(chainId)
    const result = await client.readContract({
      abi,
      functionName: 'allowance',
      args: [owner, spender],
      address: token,
    })
    this.allowanceCache.set(chainId, id, result)
    return result
  }

  @CacheActivePromise()
  async simulateApprove(
    chainId: ChainId,
    token: Address,
    owner: Address,
    spender: Address,
    value: bigint
  ): Promise<WriteContractParameters> {
    if (isNativeToken(token)) {
      throw new Error('Native token in not supported approve')
    }
    const client = await this.getClient(chainId)
    const result = await client.simulateContract({
      abi,
      account: owner,
      functionName: 'approve',
      args: [spender, value],
      address: token,
    })
    return result.request
  }

  private async buildClient(chainId: ChainId): Promise<PublicClient> {
    if (!this.context) throw new Error('No context provided')
    const chain = getChainById(chainId)
    const transportController = new WebFallbackTransportController(chain)
    await transportController.init(this.context.value)
    const client = createPublicClient({ chain, transport: transportController.createTransport() })
    this.clientMap.set(chainId, { client, transportController })
    await transportController.benchMartTransport()
    return client
  }

  private buildBlockEmitter(chainId: ChainId): Observable<Block> {
    const updateTime$: Observable<number | null> = combineLatest([
      isWindowVisibleAndFocused$().pipe(map((state) => (state ? averageBlockTime[chainId] : null))),
      sleepOnMousemove$().pipe(map((state) => (state ? 30 * 1000 : null))),
    ]).pipe(map(([time1, time2]) => time1 ?? time2))

    const client$ = from(this.getClient(chainId))

    const block$ = combineLatest([client$, updateTime$]).pipe(
      switchMap(([client, time]) => {
        return blockListener(client, time)
      }),
      distinctUntilChanged((b1: Block, b2: Block) => b1.number !== b2.number),
      shareReplay({ bufferSize: 1, refCount: true })
    )
    this.blockEmitterMap.set(chainId, block$)
    return block$
  }
}

function isWindowVisibleAndFocused$(): Observable<boolean> {
  let isFirst = true
  return merge(
    fromEvent(window, 'focus'),
    fromEvent(window, 'blur'),
    fromEvent(document, 'visibilitychange')
  ).pipe(
    startWith(null),
    map(() => {
      if (isFirst) {
        isFirst = false
        return true
      }
      return isWindowVisibleAndFocused()
    }),
    distinctUntilChanged()
  )
}

function isWindowVisibleAndFocused(): boolean {
  const isFocused = document.hasFocus()
  const isVisible = document.visibilityState === 'visible'
  return isFocused && isVisible
}

function blockListener(client: PublicClient, time: number | null): Observable<Block> {
  if (time === null) {
    return from(client.getBlock())
  }

  return timer(0, time).pipe(switchMap(() => client.getBlock()))
}

function sleepOnMousemove$(): Observable<boolean> {
  return fromEvent(window, 'mousemove').pipe(
    startWith(null),
    switchMap(() =>
      timer(10 * 1000).pipe(
        map(() => true),
        startWith(false)
      )
    ),
    distinctUntilChanged()
  )
}
