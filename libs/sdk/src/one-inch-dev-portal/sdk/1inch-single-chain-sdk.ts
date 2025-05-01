import { ChainId, IApplicationContext, IProxyClient, IWallet } from '@1inch-community/models'
import type { EIP712TypedData } from '@1inch/cross-chain-sdk'
import { FusionSDK } from '@1inch/fusion-sdk'
import { Address, Hex, isAddressEqual } from 'viem'

export class OneInchSingleChainSDK {
  private static instance: Map<ChainId, FusionSDK> = new Map()

  constructor(private readonly appContext: IApplicationContext) {}

  async getInstance(chain: ChainId): Promise<FusionSDK> {
    let sdk = OneInchSingleChainSDK.instance.get(chain)

    if (!sdk) {
      sdk = await buildFusionSDK(
        this.appContext.isEmbedded ? '/' : '/proxy/direct/',
        chain,
        this.appContext.wallet,
        this.appContext.api.getProxyClient()
      )

      OneInchSingleChainSDK.instance.set(chain, sdk)
    }

    return sdk
  }
}

async function buildFusionSDK(
  host: string,
  chain: ChainId,
  walletController: IWallet,
  proxyClient: IProxyClient
) {
  const { FusionSDK } = await import('@1inch/fusion-sdk')
  return new FusionSDK({
    url: host,
    network: chain.valueOf(),
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
      ethCall: async (address: string, callData: string): Promise<string> => {
        const activeWalletAddress = await walletController.data.getActiveAddress()
        if (!activeWalletAddress) {
          throw new Error('')
        }
        return walletController.rawCall(address as Address, callData as Hex)
      },
    },
  })
}
