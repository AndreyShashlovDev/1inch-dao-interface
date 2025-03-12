import { LongTimeCache } from '@1inch-community/core/cache'
import { BigMath } from '@1inch-community/core/math'
import {
  ChainId,
  IApplicationContext,
  IToken,
  ITokenRateSourceAdapter,
  Rate,
} from '@1inch-community/models'
import { Address, getAddress, isAddressEqual, parseAbi, zeroAddress } from 'viem'

const FactoryContractABI = parseAbi([
  'function getPair(address tokenA, address tokenB) external view returns (address pair)',
])

const PoolContractABI = parseAbi([
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
])

export class UniswapV2BaseRateAdapter implements ITokenRateSourceAdapter {
  private context?: IApplicationContext

  private readonly pools: LongTimeCache<string, [Address, Address]>

  constructor(
    public readonly name: string,
    private readonly factoryContractGetter: (chainId: ChainId) => Address,
    private readonly supportedChain: ChainId[]
  ) {
    this.pools = new LongTimeCache<string, [Address, Address]>(`${this.name}_pools`, 7)
  }

  async init(context: IApplicationContext) {
    this.context = context
  }

  isSupportedChain(chainId: ChainId): boolean {
    return this.supportedChain.includes(chainId)
  }

  async getRate(
    chainId: ChainId,
    sourceToken: IToken,
    destinationToken: IToken
  ): Promise<Rate | null> {
    if (!this.context) {
      return null
    }
    try {
      const srcTokenAddress = getAddress(sourceToken.address)
      const dstTokenAddress = getAddress(destinationToken.address)
      const [pool, token0]: [Address, Address] = await this.getPool(
        chainId,
        srcTokenAddress,
        dstTokenAddress
      )
      if (pool === zeroAddress) {
        return null
      }
      const reserves = await this.getReserves(chainId, pool)
      const lastBlockTimestamp = reserves[2]
      if (Date.now() - lastBlockTimestamp * 1000 > 3.6e6) {
        // 1h
        return null
      }
      const isRevertRate = !isAddressEqual(sourceToken.address, token0)
      const rate = BigMath.div(
        isRevertRate ? reserves[0] : reserves[1],
        isRevertRate ? reserves[1] : reserves[0],
        destinationToken.decimals,
        sourceToken.decimals,
        destinationToken.decimals
      )
      const revertedRate = BigMath.div(
        isRevertRate ? reserves[1] : reserves[0],
        isRevertRate ? reserves[0] : reserves[1],
        sourceToken.decimals,
        destinationToken.decimals,
        sourceToken.decimals
      )
      return {
        chainId,
        rate,
        revertedRate,
        isReverted: isRevertRate,
        sourceToken,
        destinationToken,
      }
    } catch (error) {
      console.error(`Error in UniswapV2BaseAdapter adapter name ${this.name}`, error)
      return null
    }
  }

  private async getPool(
    chainId: ChainId,
    srcTokenAddress: Address,
    dstTokenAddress: Address
  ): Promise<[Address, Address]> {
    if (!this.context) {
      throw new Error('UniswapV2BaseAdapter not initialized')
    }
    const id1 = [chainId, srcTokenAddress, dstTokenAddress].join(':')
    if (this.pools.has(id1)) {
      return this.pools.get(id1)!
    }
    const id2 = [chainId, dstTokenAddress, srcTokenAddress].join(':')
    if (this.pools.has(id2)) {
      return this.pools.get(id2)!
    }
    const client = await this.context.onChain.getClient(chainId)
    let pool: Address = await client.readContract({
      address: getAddress(this.factoryContractGetter(chainId)),
      functionName: 'getPair',
      args: [srcTokenAddress, dstTokenAddress],
      abi: FactoryContractABI,
    })
    if (pool !== zeroAddress) {
      pool = await client.readContract({
        address: getAddress(this.factoryContractGetter(chainId)),
        functionName: 'getPair',
        args: [dstTokenAddress, srcTokenAddress],
        abi: FactoryContractABI,
      })
    }
    let token0: Address = zeroAddress
    if (pool !== zeroAddress) {
      token0 = await client.readContract({
        address: pool,
        abi: PoolContractABI,
        functionName: 'token0',
      })
    }
    this.pools.set(id1, [pool, token0])
    this.pools.set(id2, [pool, token0])
    return [pool, token0]
  }

  private async getReserves(chainId: ChainId, pool: Address) {
    if (!this.context) {
      throw new Error('UniswapV2BaseAdapter not initialized')
    }
    const client = await this.context.onChain.getClient(chainId)
    return await client.readContract({
      address: pool,
      abi: PoolContractABI,
      functionName: 'getReserves',
    })
  }
}
