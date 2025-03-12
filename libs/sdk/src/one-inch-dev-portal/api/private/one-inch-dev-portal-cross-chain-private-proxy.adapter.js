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
import { CrossChainSDKFacade } from '../../sdk/cross-chain-sdk'
import { OneInchDevPortalCrossChainOnChainAdapter } from '../onchain/one-inch-dev-portal-cross-chain-onchain.adapter'
import { PrivateProxyClient } from './private-proxy-client'
export class OneInchDevPortalCrossChainPrivateProxyAdapter {
  host = getEnvironmentValue('oneInchDevPortalHost')
  client = new PrivateProxyClient(this.host)
  sdkFacade = new CrossChainSDKFacade()
  fallBackAdapter = new OneInchDevPortalCrossChainOnChainAdapter()
  async init(context) {
    await Promise.all([
      this.client.init(context),
      this.sdkFacade.init(context),
      this.fallBackAdapter.init(context),
    ])
  }
  async getBalances(chainIds, walletAddresses) {
    try {
      return await this.client.post('/proxy/balance', {
        chain_ids: chainIds.map((chainId) => chainId.toString()),
        addresses: walletAddresses,
      })
    } catch (e) {
      return await this.fallBackAdapter.getBalances(chainIds, walletAddresses)
    }
  }
  async getTokenBalances(chainId, walletAddress, tokenAddress) {
    return await this.fallBackAdapter.getTokenBalances(chainId, walletAddress, tokenAddress)
  }
  async getTokenList() {
    return this.client.get('/proxy/token-list')
  }
  async getTokenPrice() {
    return this.client.get('/proxy/token-price')
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
  OneInchDevPortalCrossChainPrivateProxyAdapter.prototype,
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
  OneInchDevPortalCrossChainPrivateProxyAdapter.prototype,
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
  OneInchDevPortalCrossChainPrivateProxyAdapter.prototype,
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
  OneInchDevPortalCrossChainPrivateProxyAdapter.prototype,
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
  OneInchDevPortalCrossChainPrivateProxyAdapter.prototype,
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
  OneInchDevPortalCrossChainPrivateProxyAdapter.prototype,
  'cancelOrder',
  null
)
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib25lLWluY2gtZGV2LXBvcnRhbC1jcm9zcy1jaGFpbi1wcml2YXRlLXByb3h5LmFkYXB0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJvbmUtaW5jaC1kZXYtcG9ydGFsLWNyb3NzLWNoYWluLXByaXZhdGUtcHJveHkuYWRhcHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSxtQ0FBbUMsQ0FBQTtBQWV2RSxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSx3QkFBd0IsQ0FBQTtBQUUzRCxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxrQ0FBa0MsQ0FBQTtBQUNyRSxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQTtBQUMvRCxPQUFPLEVBQUUsd0NBQXdDLEVBQUUsTUFBTSw0REFBNEQsQ0FBQTtBQUVySCxNQUFNLE9BQU8sNkNBQTZDO0lBR3ZDLElBQUksR0FBVyxtQkFBbUIsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFBO0lBQzFELE1BQU0sR0FBRyxJQUFJLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUMxQyxTQUFTLEdBQUcsSUFBSSxtQkFBbUIsRUFBRSxDQUFBO0lBQ3JDLGVBQWUsR0FBRyxJQUFJLHdDQUF3QyxFQUFFLENBQUE7SUFFakYsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUE0QjtRQUNyQyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUM7WUFDaEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1lBQ3pCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUM1QixJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7U0FDbkMsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUdLLEFBQU4sS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFtQixFQUFFLGVBQTBCO1FBQy9ELElBQUksQ0FBQztZQUNILE9BQU8sTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBcUIsZ0JBQWdCLEVBQUU7Z0JBQ2xFLFNBQVMsRUFBRSxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3hELFNBQVMsRUFBRSxlQUFlO2FBQzNCLENBQUMsQ0FBQTtRQUNKLENBQUM7UUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ1gsT0FBTyxNQUFNLElBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxlQUFlLENBQUMsQ0FBQTtRQUMxRSxDQUFDO0lBQ0gsQ0FBQztJQUVELEtBQUssQ0FBQyxnQkFBZ0IsQ0FDcEIsT0FBZ0IsRUFDaEIsYUFBc0IsRUFDdEIsWUFBcUI7UUFFckIsT0FBTyxNQUFNLElBQUksQ0FBQyxlQUFlLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLGFBQWEsRUFBRSxZQUFZLENBQUMsQ0FBQTtJQUMxRixDQUFDO0lBR0ssQUFBTixLQUFLLENBQUMsWUFBWTtRQUNoQixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLENBQUE7SUFDN0MsQ0FBQztJQUdLLEFBQU4sS0FBSyxDQUFDLGFBQWE7UUFDakIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFBO0lBQzlDLENBQUM7SUFHRCxRQUFRLENBQ04sU0FBaUIsRUFDakIsT0FBZSxFQUNmLE1BQWMsRUFDZCxhQUFzQixFQUN0QixZQUF1QyxFQUN2QyxjQUF3QjtRQUV4QixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUM1QixTQUFTLEVBQ1QsT0FBTyxFQUNQLE1BQU0sRUFDTixhQUFhLEVBQ2IsWUFBWSxFQUNaLGNBQWMsQ0FDZixDQUFBO0lBQ0gsQ0FBQztJQUdELGNBQWMsQ0FBQyxTQUFlO1FBQzVCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUE7SUFDakQsQ0FBQztJQUdELFdBQVcsQ0FBQyxTQUFlO1FBQ3pCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUE7SUFDOUMsQ0FBQztJQUVELFdBQVcsQ0FBQyxPQUFnQjtRQUMxQixNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUE7SUFDNUMsQ0FBQztJQUVELGNBQWM7UUFDWixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUE7SUFDcEIsQ0FBQztDQUNGO0FBakVPO0lBREwsa0JBQWtCLEVBQUU7Ozs7Z0ZBVXBCO0FBV0s7SUFETCxrQkFBa0IsRUFBRTs7OztpRkFHcEI7QUFHSztJQURMLGtCQUFrQixFQUFFOzs7O2tGQUdwQjtBQUdEO0lBREMsa0JBQWtCLEVBQUU7Ozs7NkVBaUJwQjtBQUdEO0lBREMsa0JBQWtCLEVBQUU7Ozs7bUZBR3BCO0FBR0Q7SUFEQyxrQkFBa0IsRUFBRTs7OztnRkFHcEIifQ==
