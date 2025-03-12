import {
  ChainId,
  EIP6963ProviderInfo,
  EmbeddedBootstrapConfig,
  IDataAdapter,
  IWallet,
  IWalletAdapter,
  IWalletInternal,
} from '@1inch-community/models'
import { Subject } from 'rxjs'
import {
  Address,
  SignTypedDataParameters,
  WriteContractParameters,
  WriteContractReturnType,
} from 'viem'
import { GlobalDataAdapter } from './global-data-adapter'
export declare class ConnectWalletEmbeddedController implements IWallet, IWalletInternal {
  private readonly config
  currentActiveAdapter: IWalletAdapter | null
  activeAdapters: Map<string, IWalletAdapter>
  readonly data: GlobalDataAdapter
  readonly update$: Subject<void>
  get isConnected(): boolean
  get connectedWalletInfo(): EIP6963ProviderInfo | null
  constructor(config: EmbeddedBootstrapConfig)
  init(): Promise<void>
  getSupportedWallets(): Promise<EIP6963ProviderInfo[]>
  writeContract(params: WriteContractParameters): Promise<WriteContractReturnType>
  signTypedData(typeData: SignTypedDataParameters): Promise<`0x${string}`>
  setChainIds(chainIds: ChainId[]): void
  connect(info: EIP6963ProviderInfo): Promise<boolean>
  addConnection(info: EIP6963ProviderInfo): Promise<boolean>
  disconnect(): Promise<boolean>
  getDataAdapter(info: EIP6963ProviderInfo): IDataAdapter
  setActiveAddress(info: EIP6963ProviderInfo, address: Address): Promise<void>
}
