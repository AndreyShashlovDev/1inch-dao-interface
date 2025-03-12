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
import { getEnvironmentValue } from '@1inch-community/core/environment'
import { getChainIdList } from '../../../chain/chain-id-list'
import { CrossChainSDKFacade } from '../../sdk/cross-chain-sdk'
import { OneInchDevPortalCrossChainOnChainAdapter } from '../onchain'
import { PublicProxyClient } from './public-proxy-client'
export class OneInchDevPortalCrossChainPublicProxyAdapter {
  host = getEnvironmentValue('oneInchDevPortalHost')
  apiToken = getEnvironmentValue('oneInchDevPortalToken')
  client = new PublicProxyClient(this.host, this.apiToken)
  sdkFacade = new CrossChainSDKFacade()
  fallBackAdapter = new OneInchDevPortalCrossChainOnChainAdapter()
  async init(context) {
    await Promise.all([
      this.client.init(),
      this.sdkFacade.init(context),
      this.fallBackAdapter.init(context),
    ])
  }
  async getBalances(chainIds, walletAddresses) {
    const pending = []
    for (const chainId of chainIds) {
      for (const walletAddress of walletAddresses) {
        pending.push(
          this.client
            .get(`/balance/v1.2/${chainId}/balances/${walletAddress}`)
            .then((response) => {
              return {
                id: [chainId, walletAddress].join(':'),
                result: response,
                error: null,
              }
            })
            .catch((error) => {
              return {
                id: [chainId, walletAddress].join(':'),
                result: null,
                error: {
                  code: 0,
                  message: error.message,
                },
              }
            })
        )
      }
    }
    return await Promise.all(pending)
  }
  async getTokenBalances(chainId, walletAddress, tokenAddress) {
    return await this.fallBackAdapter.getTokenBalances(chainId, walletAddress, tokenAddress)
  }
  async getTokenList() {
    return this.client.get('/token/v1.2/multi-chain')
  }
  async getTokenPrice() {
    const chains = getChainIdList()
    return Promise.all(
      chains.map(async (chainId) => {
        const result = await this.client.get(`/price/v1.1/${chainId}?currency=USD`)
        return {
          id: chainId.toString(),
          result,
          error: null,
        }
      })
    )
  }
  getQuote(fromToken, toToken, amount, walletAddress, customPreset, enableEstimate) {
    return this.sdkFacade.getQuote(
      fromToken,
      toToken,
      amount,
      walletAddress,
      customPreset,
      enableEstimate
    )
  }
  getOrderStatus(orderHash) {
    return this.sdkFacade.getOrderStatus(orderHash)
  }
  cancelOrder(orderHash) {
    return this.sdkFacade.cancelOrder(orderHash)
  }
  getGasPrice(chainId) {
    throw new Error('Method not implemented.')
  }
  getProxyClient() {
    return this.client
  }
}
__decorate(
  [
    CacheActivePromise(),
    __metadata('design:type', Function),
    __metadata('design:paramtypes', [Array, Array]),
    __metadata('design:returntype', Promise),
  ],
  OneInchDevPortalCrossChainPublicProxyAdapter.prototype,
  'getBalances',
  null
)
__decorate(
  [
    CacheActivePromise(),
    __metadata('design:type', Function),
    __metadata('design:paramtypes', []),
    __metadata('design:returntype', Promise),
  ],
  OneInchDevPortalCrossChainPublicProxyAdapter.prototype,
  'getTokenList',
  null
)
__decorate(
  [
    CacheActivePromise(),
    __metadata('design:type', Function),
    __metadata('design:paramtypes', []),
    __metadata('design:returntype', Promise),
  ],
  OneInchDevPortalCrossChainPublicProxyAdapter.prototype,
  'getTokenPrice',
  null
)
__decorate(
  [
    CacheActivePromise(),
    __metadata('design:type', Function),
    __metadata('design:paramtypes', [Object, Object, BigInt, String, Object, Boolean]),
    __metadata('design:returntype', Promise),
  ],
  OneInchDevPortalCrossChainPublicProxyAdapter.prototype,
  'getQuote',
  null
)
__decorate(
  [
    CacheActivePromise(),
    __metadata('design:type', Function),
    __metadata('design:paramtypes', [String]),
    __metadata('design:returntype', Promise),
  ],
  OneInchDevPortalCrossChainPublicProxyAdapter.prototype,
  'getOrderStatus',
  null
)
__decorate(
  [
    CacheActivePromise(),
    __metadata('design:type', Function),
    __metadata('design:paramtypes', [String]),
    __metadata('design:returntype', Promise),
  ],
  OneInchDevPortalCrossChainPublicProxyAdapter.prototype,
  'cancelOrder',
  null
)
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib25lLWluY2gtZGV2LXBvcnRhbC1jcm9zcy1jaGFpbi1wdWJsaWMtcHJveHkuYWRhcHRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm9uZS1pbmNoLWRldi1wb3J0YWwtY3Jvc3MtY2hhaW4tcHVibGljLXByb3h5LmFkYXB0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0sbUNBQW1DLENBQUE7QUFrQnZFLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLHVCQUF1QixDQUFBO0FBQ3pELE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLGtDQUFrQyxDQUFBO0FBQ3JFLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSw4QkFBOEIsQ0FBQTtBQUM3RCxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQTtBQUMvRCxPQUFPLEVBQUUsd0NBQXdDLEVBQUUsTUFBTSxZQUFZLENBQUE7QUFFckUsTUFBTSxPQUFPLDRDQUE0QztJQUd0QyxJQUFJLEdBQVcsbUJBQW1CLENBQUMsc0JBQXNCLENBQUMsQ0FBQTtJQUMxRCxRQUFRLEdBQUcsbUJBQW1CLENBQUMsdUJBQXVCLENBQUMsQ0FBQTtJQUN2RCxNQUFNLEdBQUcsSUFBSSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQTtJQUN4RCxTQUFTLEdBQUcsSUFBSSxtQkFBbUIsRUFBRSxDQUFBO0lBQ3JDLGVBQWUsR0FBRyxJQUFJLHdDQUF3QyxFQUFFLENBQUE7SUFFakYsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUE0QjtRQUNyQyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUM7WUFDaEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUU7WUFDbEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1lBQzVCLElBQUksQ0FBQyxlQUFlLENBQUMs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
