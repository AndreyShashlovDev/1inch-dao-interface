import { ChainId, EIP6963ProviderDetail, IWalletAdapter } from '@1inch-community/models'
import type {
  Address,
  SignTypedDataParameters,
  SignTypedDataReturnType,
  WalletClient,
  WriteContractParameters,
  WriteContractReturnType,
} from 'viem'
import { ProviderDataAdapter } from '../provider-data-adapter'
export declare class UniversalBrowserExtensionAdapter implements IWalletAdapter {
  private readonly providerDetail
  readonly data: ProviderDataAdapter
  client: WalletClient | null
  get info(): import('@1inch-community/models').EIP6963ProviderInfo
  constructor(providerDetail: EIP6963ProviderDetail)
  connect(chainId: ChainId): Promise<boolean>
  restoreConnect(chainId: ChainId, force?: boolean): Promise<boolean>
  disconnect(): Promise<boolean>
  changeChain(chainId: ChainId): Promise<boolean>
  isConnected(): Promise<boolean>
  setActiveAddress(address: Address): void
  writeContract(params: WriteContractParameters): Promise<WriteContractReturnType>
  signTypedData(typeData: SignTypedDataParameters): Promise<SignTypedDataReturnType>
}
