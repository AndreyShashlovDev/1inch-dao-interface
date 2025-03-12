'use strict'
// import {
//   ChainId,
//   FusionQuoteReceiveDto,
//   GasPriceDto,
//   IApplicationContext,
//   IOneInchDevPortalAdapter,
//   ITokenDto,
//   QuoteReceiveCustomPreset
// } from '@1inch-community/models';
// import type { Address, Hash } from 'viem';
// import { CacheActivePromise } from '@1inch-community/core/decorators';
// import { TimeCache } from '@1inch-community/core/cache';
// import { getEnvironmentValue } from '@1inch-community/core/environment';
// import { buildFusionSdk } from './fusion-sdk';
// import { cancelFusionOrder } from 'chain';
//
// const tokenPriceCache = new TimeCache<ChainId, Record<Address, string>>(10000)
// const fusionQuoteReceiveCache = new TimeCache<string, FusionQuoteReceiveDto | null>(5000)
// const gasPriceCache = new TimeCache<ChainId, GasPriceDto>(5000)
//
// export class OneInchDevPortalAdapter implements IOneInchDevPortalAdapter {
//
//   private readonly host: string = getEnvironmentValue('oneInchDevPortalHost')
//   private readonly apiToken = getEnvironmentValue('oneInchDevPortalToken')
//   private context!: IApplicationContext
//
//   async init(context: IApplicationContext): Promise<void> {
//     this.context = context
//   }
//
//   @CacheActivePromise()
//   async getWhiteListedTokens(chainId: ChainId): Promise<ITokenDto[]> {
//     const response = await fetch(`${this.host}/token/v1.2/${chainId}/token-list`, { headers: this.makeHeaders() });
//     const data: { tokens: ITokenDto[] } = await response.json();
//     return data.tokens ?? [];
//   }
//
//   @CacheActivePromise()
//   async getBalancesByWalletAddress(chainId: ChainId, walletAddress: Address): Promise<Record<Address, string>> {
//     const response = await fetch(`${this.host}/balance/v1.2/${chainId}/balances/${walletAddress}`, { headers: this.makeHeaders() });
//     return await response.json();
//   }
//
//
//   @CacheActivePromise()
//   async getTokenPrices(chainId: ChainId): Promise<Record<Address, string>> {
//     const cacheValue = tokenPriceCache.get(chainId)
//     if (cacheValue) {
//       return cacheValue
//     }
//     const queryParams = new URLSearchParams({ currency: 'USD' });
//     const response = await fetch(`${this.host}/price/v1.1/${chainId}?${queryParams}`, { headers: this.makeHeaders() });
//     const result = await response.json();
//     tokenPriceCache.set(chainId, result)
//     return result
//   }
//
//   /**
//    * doc link https://portal.1inch.dev/documentation/fusion/swagger/quoter?method=get&path=%2Fv1.0%2F1%2Fquote%2Freceive
//    * */
//   @CacheActivePromise()
//   async getFusionQuoteReceive(
//     chainId: ChainId,
//     fromTokenAddress: Address,
//     toTokenAddress: Address,
//     amount: bigint,
//     walletAddress: Address,
//     customPreset?: QuoteReceiveCustomPreset,
//     enableEstimate = false,
//   ): Promise<FusionQuoteReceiveDto | null> {
//     const { auctionDuration, auctionEndAmount, auctionStartAmount, points } = customPreset ?? {}
//     const id = [
//       chainId, fromTokenAddress, toTokenAddress, amount, walletAddress, enableEstimate,
//       auctionDuration, auctionEndAmount, auctionStartAmount, points?.join(',')
//     ].filter(Boolean).join(':')
//
//     const cacheData = fusionQuoteReceiveCache.get(id)
//     if (cacheData) {
//       return cacheData
//     }
//
//     const queryParams = new URLSearchParams({
//       fromTokenAddress,
//       toTokenAddress,
//       walletAddress,
//       amount: amount.toString(),
//       enableEstimate: enableEstimate.toString(),
//       isLedgerLive: 'false',
//     });
//
//     const response = await fetch(`${this.host}/fusion/quoter/v2.0/${chainId}/quote/receive?${queryParams}`, {
//       method: !customPreset ? 'GET' : 'POST',
//       body: customPreset && JSON.stringify(customPreset),
//       headers: this.makeHeaders()
//     });
//     if (!response.ok) {
//       fusionQuoteReceiveCache.set(id, null)
//       return null
//     }
//     const result = await response.json();
//     fusionQuoteReceiveCache.set(id, result)
//     return { ...result, chainId }
//   }
//
//   /**
//    * doc link https://portal.1inch.dev/documentation/gas-price/swagger?method=get&path=%2Fv1.5%2F1
//    * */
//   @CacheActivePromise()
//   async getGasPrice(chainId: ChainId): Promise<GasPriceDto | null> {
//     const cacheValue = gasPriceCache.get(chainId)
//     if (cacheValue) {
//       return cacheValue
//     }
//     const response = await fetch(`${this.host}/gas-price/v1.5/${chainId}`, { headers: this.makeHeaders() });
//     if (!response.ok) {
//       return null
//     }
//     const result = await response.json();
//     gasPriceCache.set(chainId, result)
//     return result
//   }
//
//   @CacheActivePromise()
//   async getFusionOrderStatus(chainId: ChainId, orderHash: Hash) {
//     const sdk = await buildFusionSdk(chainId, this.context.wallet)
//     return await sdk.getOrderStatus(orderHash)
//   }
//
//   @CacheActivePromise()
//   async cancelFusionOrder(chainId: ChainId, orderHash: Hash) {
//     const status = await this.getFusionOrderStatus(chainId, orderHash)
//     const wallet = await this.context.wallet.data.getActiveAddress()
//     if (!wallet) throw new Error('')
//     const result = await cancelFusionOrder(chainId, wallet, status.order.makerTraits, orderHash)
//     return this.context.wallet.writeContract(result.request)
//   }
//
//   private makeHeaders() {
//     const headers = new Headers()
//     headers.set('Accept', 'application/json')
//     headers.set('Content-Type', 'application/json')
//     this.apiToken && headers.set('Authorization', this.apiToken)
//     return headers
//   }
// }
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib25lLWluY2gtZGV2LXBvcnRhbC5hZGFwdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsib25lLWluY2gtZGV2LXBvcnRhbC5hZGFwdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxXQUFXO0FBQ1gsYUFBYTtBQUNiLDJCQUEyQjtBQUMzQixpQkFBaUI7QUFDakIseUJBQXlCO0FBQ3pCLDhCQUE4QjtBQUM5QixlQUFlO0FBQ2YsNkJBQTZCO0FBQzdCLG9DQUFvQztBQUNwQyw2Q0FBNkM7QUFDN0MseUVBQXlFO0FBQ3pFLDJEQUEyRDtBQUMzRCwyRUFBMkU7QUFDM0UsaURBQWlEO0FBQ2pELDZDQUE2QztBQUM3QyxFQUFFO0FBQ0YsaUZBQWlGO0FBQ2pGLDRGQUE0RjtBQUM1RixrRUFBa0U7QUFDbEUsRUFBRTtBQUNGLDZFQUE2RTtBQUM3RSxFQUFFO0FBQ0YsZ0ZBQWdGO0FBQ2hGLDZFQUE2RTtBQUM3RSwwQ0FBMEM7QUFDMUMsRUFBRTtBQUNGLDhEQUE4RDtBQUM5RCw2QkFBNkI7QUFDN0IsTUFBTTtBQUNOLEVBQUU7QUFDRiwwQkFBMEI7QUFDMUIseUVBQXlFO0FBQ3pFLHNIQUFzSDtBQUN0SCxtRUFBbUU7QUFDbkUsZ0NBQWdDO0FBQ2hDLE1BQU07QUFDTixFQUFFO0FBQ0YsMEJBQTBCO0FBQzFCLG1IQUFtSDtBQUNuSCx1SUFBdUk7QUFDdkksb0NBQW9DO0FBQ3BDLE1BQU07QUFDTixFQUFFO0FBQ0YsRUFBRTtBQUNGLDBCQUEwQjtBQUMxQiwrRUFBK0U7QUFDL0Usc0RBQXNEO0FBQ3RELHdCQUF3QjtBQUN4QiwwQkFBMEI7QUFDMUIsUUFBUTtBQUNSLG9FQUFvRTtBQUNwRSwwSEFBMEg7QUFDMUgsNENBQTRDO0FBQzVDLDJDQUEyQztBQUMzQyxvQkFBb0I7QUFDcEIsTUFBTTtBQUNOLEVBQUU7QUFDRixRQUFRO0FBQ1IsMkhBQTJIO0FBQzNILFVBQVU7QUFDViwwQkFBMEI7QUFDMUIsaUNBQWlDO0FBQ2pDLHdCQUF3QjtBQUN4QixpQ0FBaUM7QUFDakMsK0JBQStCO0FBQy9CLHNCQUFzQjtBQUN0Qiw4QkFBOEI7QUFDOUIsK0NBQStDO0FBQy9DLDhCQUE4QjtBQUM5QiwrQ0FBK0M7QUFDL0MsbUdBQW1HO0FBQ25HLG1CQUFtQjtBQUNuQiwwRkFBMEY7QUFDMUYsaUZBQWlGO0FBQ2pGLGtDQUFrQztBQUNsQyxFQUFFO0FBQ0Ysd0RBQXdEO0FBQ3hELHVCQUF1QjtBQUN2Qix5QkFBeUI7QUFDekIsUUFBUTtBQUNSLEVBQUU7QUFDRixnREFBZ0Q7QUFDaEQsMEJBQTBCO0FBQzFCLHdCQUF3QjtBQUN4Qix1QkFBdUI7QUFDdkIsbUNBQW1DO0FBQ25DLG1EQUFtRDtBQUNuRCwrQkFBK0I7QUFDL0IsVUFBVTtBQUNWLEVBQUU7QUFDRixnSEFBZ0g7QUFDaEgsZ0RBQWdEO0FBQ2hELDREQUE0RDtBQUM1RCxvQ0FBb0M7QUFDcEMsVUFBVTtBQUNWLDBCQUEwQjtBQUMxQiw4Q0FBOEM7QUFDOUMsb0JBQW9CO0FBQ3BCLFFBQVE7QUFDUiw0Q0FBNEM7QUFDNUMsOENBQThDO0FBQzlDLG9DQUFvQztBQUNwQyxNQUFNO0FBQ04sRUFBRTtBQUNGLFFBQVE7QUFDUixxR0FBcUc7QUFDckcsVUFBVTtBQUNWLDBCQUEwQjtBQUMxQix1RUFBdUU7QUFDdkUsb0RBQW9EO0FBQ3BELHdCQUF3QjtBQUN4QiwwQkFBMEI7QUFDMUIsUUFBUTtBQUNSLCtHQUErRztBQUMvRywwQkFBMEI7QUFDMUIsb0JBQW9CO0FBQ3BCLFFBQVE7QUFDUiw0Q0FBNEM7QUFDNUMseUNBQXlDO0FBQ3pDLG9CQUFvQjtBQUNwQixNQUFNO0FBQ04sRUFBRTtBQUNGLDBCQUEwQjtBQUMxQixvRUFBb0U7QUFDcEUscUVBQXFFO0FBQ3JFLGlEQUFpRDtBQUNqRCxNQUFNO0FBQ04sRUFBRTtBQUNGLDBCQUEwQjtBQUMxQixpRUFBaUU7QUFDakUseUVBQXlFO0FBQ3pFLHVFQUF1RTtBQUN2RSx1Q0FBdUM7QUFDdkMsbUdBQW1HO0FBQ25HLCtEQUErRDtBQUMvRCxNQUFNO0FBQ04sRUFBRTtBQUNGLDRCQUE0QjtBQUM1QixvQ0FBb0M7QUFDcEMsZ0RBQWdEO0FBQ2hELHNEQUFzRDtBQUN0RCxtRUFBbUU7QUFDbkUscUJBQXFCO0FBQ3JCLE1BQU07QUFDTixJQUFJIn0=
