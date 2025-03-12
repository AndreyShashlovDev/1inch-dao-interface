import {
  ChainId,
  IApplicationContext,
  IToken,
  ITokenRateSourceAdapter,
  Rate,
} from '@1inch-community/models'
import { Address, parseAbi, parseUnits } from 'viem'

const abi = parseAbi([
  'function getRate(address srcToken, address dstToken, bool useWrappers) external view returns (uint256 weightedRate)',
])

export class OneInchOracleBaseRateAdapter implements ITokenRateSourceAdapter {
  private context?: IApplicationContext

  constructor(
    public readonly name: string,
    private readonly factoryContractGetter: (chainId: ChainId) => Address,
    private readonly supportedChain: ChainId[]
  ) {}

  async init(context: IApplicationContext) {
    this.context = context
  }

  async getRate(
    chainId: ChainId,
    sourceToken: IToken,
    destinationToken: IToken
  ): Promise<Rate | null> {
    if (!this.context) {
      return null
    }
    const client = await this.context.onChain.getClient(chainId)
    const contractAddress = this.factoryContractGetter(chainId)
    const rateRaw = await client.readContract({
      abi,
      address: contractAddress,
      functionName: 'getRate',
      args: [sourceToken.address, destinationToken.address, false],
    })
    const [rate, revertedRate] = normalizeRate(rateRaw, sourceToken, destinationToken)
    return {
      chainId,
      sourceToken,
      destinationToken,
      rate,
      revertedRate,
      isReverted: false,
    }
  }

  isSupportedChain(chainId: ChainId): boolean {
    return this.supportedChain.includes(chainId)
  }
}

function normalizeRate(
  rate: bigint,
  sourceToken: IToken,
  destinationToken: IToken
): [bigint, bigint] {
  const numerator = 10 ** sourceToken.decimals
  const denominator = 10 ** destinationToken.decimals
  const price = (Number(rate) * numerator) / denominator / 1e18
  return [
    parseUnits(price.toString(), destinationToken.decimals),
    parseUnits((1 / price).toString(), sourceToken.decimals),
  ]
}
