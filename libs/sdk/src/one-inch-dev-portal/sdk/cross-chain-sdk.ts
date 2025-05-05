import { getEnvironmentValue } from '@1inch-community/core/environment'
import { IProxyClient, IWallet } from '@1inch-community/models'
import type { EIP712TypedData } from '@1inch/cross-chain-sdk'
import { Address, isAddressEqual } from 'viem'

async function buildSDK(walletController: IWallet, proxyClient: IProxyClient) {
  const { SDK } = await import('@1inch/cross-chain-sdk')
  const host: string = getEnvironmentValue('oneInchDevPortalHost')
  return new SDK({
    url: host,
    httpProvider: proxyClient,
    blockchainProvider: {
      signTypedData: async (
        walletAddress: Address,
        typedData: EIP712TypedData
      ): Promise<string> => {
        const activeWalletAddress = await walletController.data.getActiveAddress()
        if (!activeWalletAddress || !isAddressEqual(activeWalletAddress, walletAddress)) {
          throw new Error('')
        }
        return await walletController.signTypedData(typedData as any)
      },
      ethCall: async (): Promise<string> => {
        return ''
      },
    },
  })
}
