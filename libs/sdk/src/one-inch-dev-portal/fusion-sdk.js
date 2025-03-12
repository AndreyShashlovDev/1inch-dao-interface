'use strict'
// import { getEnvironmentValue } from '@1inch-community/core/environment';
// import { ChainId, IWallet } from '@1inch-community/models';
// import type { BlockchainProviderConnector, EIP712TypedData, HttpProviderConnector } from '@1inch/fusion-sdk';
// import { Address, Hex } from 'viem';
//
// export async function buildFusionSdk(chainId: ChainId, walletController: IWallet) {
//   const { FusionSDK } = await import('@1inch/fusion-sdk');
//   return new FusionSDK({
//     url: getEnvironmentValue('oneInchDevPortalHost') + '/fusion',
//     authKey: getEnvironmentValue('oneInchDevPortalToken'),
//     network: chainId as any,
//     blockchainProvider: new BlockchainFusionProviderConnector(chainId, walletController),
//     httpProvider: new FusionHttpProviderConnector()
//   });
// }
//
// class BlockchainFusionProviderConnector implements BlockchainProviderConnector {
//
//   private readonly client = getClient(this.chainId)
//
//   constructor(
//     private readonly chainId: ChainId,
//     private readonly walletController: IWallet
//   ) {
//   }
//
//   async signTypedData(_: string, typedData: EIP712TypedData): Promise<string> {
//     return await this.walletController.signTypedData(typedData as any)
//   }
//
//   async ethCall(contractAddress: string, callData: string): Promise<string> {
//     const resp = await this.client.call({
//       to: contractAddress as Address,
//       data: callData as Hex
//     })
//     return resp.data ?? ''
//   }
//
// }
//
// class FusionHttpProviderConnector implements HttpProviderConnector {
//   async get<T>(url: string): Promise<T> {
//     const resp = await fetch(url)
//     return resp.json()
//   }
//   async post<T>(url: string, data: unknown): Promise<T> {
//     const resp = await fetch(url, {
//       method: 'POST',
//       body: JSON.stringify(data)
//     })
//     return resp.json().catch(() => void 0)
//   }
// }
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnVzaW9uLXNkay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImZ1c2lvbi1zZGsudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLDJFQUEyRTtBQUMzRSw4REFBOEQ7QUFDOUQsZ0hBQWdIO0FBQ2hILHVDQUF1QztBQUN2QyxFQUFFO0FBQ0Ysc0ZBQXNGO0FBQ3RGLDZEQUE2RDtBQUM3RCwyQkFBMkI7QUFDM0Isb0VBQW9FO0FBQ3BFLDZEQUE2RDtBQUM3RCwrQkFBK0I7QUFDL0IsNEZBQTRGO0FBQzVGLHNEQUFzRDtBQUN0RCxRQUFRO0FBQ1IsSUFBSTtBQUNKLEVBQUU7QUFDRixtRkFBbUY7QUFDbkYsRUFBRTtBQUNGLHNEQUFzRDtBQUN0RCxFQUFFO0FBQ0YsaUJBQWlCO0FBQ2pCLHlDQUF5QztBQUN6QyxpREFBaUQ7QUFDakQsUUFBUTtBQUNSLE1BQU07QUFDTixFQUFFO0FBQ0Ysa0ZBQWtGO0FBQ2xGLHlFQUF5RTtBQUN6RSxNQUFNO0FBQ04sRUFBRTtBQUNGLGdGQUFnRjtBQUNoRiw0Q0FBNEM7QUFDNUMsd0NBQXdDO0FBQ3hDLDhCQUE4QjtBQUM5QixTQUFTO0FBQ1QsNkJBQTZCO0FBQzdCLE1BQU07QUFDTixFQUFFO0FBQ0YsSUFBSTtBQUNKLEVBQUU7QUFDRix1RUFBdUU7QUFDdkUsNENBQTRDO0FBQzVDLG9DQUFvQztBQUNwQyx5QkFBeUI7QUFDekIsTUFBTTtBQUNOLDREQUE0RDtBQUM1RCxzQ0FBc0M7QUFDdEMsd0JBQXdCO0FBQ3hCLG1DQUFtQztBQUNuQyxTQUFTO0FBQ1QsNkNBQTZDO0FBQzdDLE1BQU07QUFDTixJQUFJIn0=
