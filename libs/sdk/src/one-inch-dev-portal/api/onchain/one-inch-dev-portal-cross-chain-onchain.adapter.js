var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc)
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r
    return c > 3 && r && Object.defineProperty(target, key, r), r
  }
var __metadata =
  (this && this.__metadata) ||
  function (k, v) {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(k, v)
  }
import { CacheActivePromise } from '@1inch-community/core/decorators'
import { parseAbi } from 'viem'
import { getBalanceHelperAddress, isNativeToken } from '../../../chain'
const abi = parseAbi([
  'function balanceOf(address _owner) public view returns (uint256 balance)',
  'function getBalances(address user, address[] calldata tokenAddresses) external view returns (uint256[] memory)',
])
export class OneInchDevPortalCrossChainOnChainAdapter {
  context
  async init(context) {
    this.context = context
  }
  async getTokenBalances(chainId, walletAddress, tokenAddress) {
    if (!this.context)
      throw new Error(
        'OneInchDevPortalCrossChainOnChainAdapter.getTokenBalances Error: Missing context'
      )
    const client = await this.context.onChain.getClient(chainId)
    if (isNativeToken(tokenAddress)) {
      return await client.getBalance({ address: walletAddress })
    }
    return await client.readContract({
      abi,
      address: tokenAddress,
      functionName: 'balanceOf',
      args: [walletAddress],
    })
  }
  async getBalances(chainIds, walletAddresses) {
    if (!this.context) return []
    const tokenIdMap = await this.context.tokenStorage.getTokenAddressListOrderByChainId(chainIds)
    const pending = []
    for (const chainId of chainIds) {
      const client = await this.context.onChain.getClient(chainId)
      const tokenList = tokenIdMap[chainId]
      if (getBalanceHelperAddress(chainId) !== null) {
        this.getBalancesHelper(chainId, client, walletAddresses, tokenList, (collect) =>
          pending.push(collect)
        )
      } else {
        this.getBalancesMulticall(chainId, client, walletAddresses, tokenList, (collect) =>
          pending.push(collect)
        )
      }
    }
    const result = await Promise.all(pending)
    return mergeProxyResultBalance(result.flat())
  }
  getGasPrice(chainId) {
    throw new Error('Method not implemented.')
  }
  getTokenPrice() {
    throw new Error('Method not implemented.')
  }
  getTokenList() {
    throw new Error('OneInchDevPortalCrossChainOnChainAdapter not supported getTokenList call')
  }
  getProxyClient() {
    throw new Error('OneInchDevPortalCrossChainOnChainAdapter not supported getProxyClient call')
  }
  getQuote() {
    throw new Error('OneInchDevPortalCrossChainOnChainAdapter not supported getQuote call')
  }
  getOrderStatus(orderHash) {
    throw new Error('OneInchDevPortalCrossChainOnChainAdapter not supported getOrderStatus call')
  }
  cancelOrder(orderHash) {
    throw new Error('OneInchDevPortalCrossChainOnChainAdapter not supported cancelOrder call')
  }
  getBalancesMulticall(chainId, client, walletAddresses, tokenList, collector) {
    if (!this.context)
      throw new Error(
        'OneInchDevPortalCrossChainOnChainAdapter.getBalancesMulticall Error: Missing context'
      )
    const contracts = []
    for (const token of tokenList) {
      for (const walletAddress of walletAddresses) {
        if (isNativeToken(token)) {
          collector(
            client
              .getBalance({ address: walletAddress })
              .catch(() => 0n)
              .then((result) => {
                return [
                  {
                    id: [chainId, walletAddress].join(':'),
                    result: {
                      [token]: result.toString(),
                    },
                    error: null,
                  },
                ]
              })
          )
          continue
        }
        contracts.push({
          abi,
          functionName: 'balanceOf',
          address: token,
          args: [walletAddress],
          _resultData: {
            chainId,
            walletAddress,
            tokenAddress: token,
          },
        })
      }
    }
    const requestResultPending = client
      .multicall({ contracts, batchSize: 1024 })
      .then((requestResult) => {
        const resultMap = new Map()
        for (let i = 0; i < requestResult.length; i++) {
          const result = requestResult[i]
          if (result.result === 0n) {
            continue
          }
          const { chainId, tokenAddress, walletAddress } = contracts[i]._resultData
          if (result.status === 'failure') {
            console.warn(
              `Load token balance error ${chainId} ${tokenAddress} ${walletAddress} \n`,
              result.error.message
            )
            continue
          }
          const id = [chainId, walletAddress].join(':')
          let resultMapRecord = resultMap.get(id)
          if (!resultMapRecord) {
            resultMapRecord = {
              id,
              result: {},
              error: null,
            }
          }
          if (resultMapRecord.error === null && resultMapRecord.result !== null) {
            resultMapRecord.result[tokenAddress] = (result.result ?? 0).toString()
          }
          resultMap.set(id, resultMapRecord)
        }
        return [...resultMap.values()]
      })
    collector(requestResultPending)
  }
  getBalancesHelper(chainId, client, walletAddresses, tokenList, collector) {
    const contractAddress = getBalanceHelperAddress(chainId)
    if (contractAddress === null)
      throw new Error(
        `OneInchDevPortalCrossChainOnChainAdapter.getBalancesHelper Error, contract address address does not exist by chain ${chainId}`
      )
    for (const walletAddress of walletAddresses) {
      const pending = client
        .readContract({
          abi,
          functionName: 'getBalances',
          address: contractAddress,
          args: [walletAddress, tokenList],
        })
        .then((balances) => {
          const result = {}
          const id = [chainId, walletAddress].join(':')
          for (let i = 0; i < balances.length; i++) {
            const balance = balances[i]
            if (balance === 0n) continue
            const tokenAddress = tokenList[i]
            result[tokenAddress] = balance.toString()
          }
          return [
            {
              id,
              result,
              error: null,
            },
          ]
        })
        .catch((err) => {
          console.warn(`Load balance from helper error`, err)
          return [
            {
              id: [chainId, walletAddress].join(':'),
              result: null,
              error: { code: err.code ?? 0, message: err.message },
            },
          ]
        })
      collector(pending)
    }
  }
}
__decorate(
  [
    CacheActivePromise(),
    __metadata('design:type', Function),
    __metadata('design:paramtypes', [Number, String, String]),
    __metadata('design:returntype', Promise),
  ],
  OneInchDevPortalCrossChainOnChainAdapter.prototype,
  'getTokenBalances',
  null
)
__decorate(
  [
    CacheActivePromise(),
    __metadata('design:type', Function),
    __metadata('design:paramtypes', [Array, Array]),
    __metadata('design:returntype', Promise),
  ],
  OneInchDevPortalCrossChainOnChainAdapter.prototype,
  'getBalances',
  null
)
function mergeProxyResultBalance(data) {
  const result = new Map()
  for (const item of data) {
    if (result.has(item.id)) {
      const resultItem = result.get(item.id)
      if (resultItem.result) {
        resultItem.result = { ...resultItem.result, ...item.result }
      }
      continue
    }
    result.set(item.id, item)
  }
  return [...result.values()]
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib25lLWluY2gtZGV2LXBvcnRhbC1jcm9zcy1jaGFpbi1vbmNoYWluLmFkYXB0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJvbmUtaW5jaC1kZXYtcG9ydGFsLWNyb3NzLWNoYWluLW9uY2hhaW4uYWRhcHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxrQ0FBa0MsQ0FBQTtBQUNyRSxPQUFPLEVBQ0wsT0FBTyxHQVdSLE1BQU0seUJBQXlCLENBQUE7QUFDaEMsT0FBTyxFQUFFLHVCQUF1QixFQUFFLGFBQWEsRUFBRSxNQUFNLGdCQUFnQixDQUFBO0FBQ3ZFLE9BQU8sRUFBc0IsUUFBUSxFQUFnQixNQUFNLE1BQU0sQ0FBQTtBQUVqRSxNQUFNLEdBQUcsR0FBRyxRQUFRLENBQUM7SUFDbkIsMEVBQTBFO0lBQzFFLGdIQUFnSDtDQUNqSCxDQUFDLENBQUE7QUFjRixNQUFNLE9BQU8sd0NBQXdDO0lBRzNDLE9BQU8sQ0FBc0I7SUFFckMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUE0QjtRQUNyQyxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQTtJQUN4QixDQUFDO0lBR0ssQUFBTixLQUFLLENBQUMsZ0JBQWdCLENBQ3BCLE9BQWdCLEVBQ2hCLGFBQXNCLEVBQ3RCLFlBQXFCO1FBRXJCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTztZQUNmLE1BQU0sSUFBSSxLQUFLLENBQ2Isa0ZBQWtGLENBQ25GLENBQUE7UUFDSCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUM1RCxJQUFJLGFBQWEsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDO1lBQ2hDLE9BQU8sTUFBTSxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsT0FBTyxFQUFFLGFBQWEsRUFBRSxDQUFDLENBQUE7UUFDNUQsQ0FB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
