import {
  ChainId,
  EIP6963ProviderInfo,
  IApplicationContext,
  IDataAdapter,
  IWallet,
  IWalletAdapter,
  IWalletInternal,
} from '@1inch-community/models'
import { Subject } from 'rxjs'
import type {
  Address,
  SignTypedDataParameters,
  WriteContractParameters,
  WriteContractReturnType,
} from 'viem'
import { GlobalDataAdapter } from './global-data-adapter'
export declare class WalletController implements IWallet, IWalletInternal {
  private readonly context
  readonly data: GlobalDataAdapter
  readonly activeAdapters: Map<string, IWalletAdapter>
  readonly update$: Subject<void>
  private currentActiveAdapterId
  private readonly adapters
  get isConnected(): boolean
  get connectedWalletInfo(): EIP6963ProviderInfo | null
  get currentActiveAdapter(): IWalletAdapter | null
  init(context: IApplicationContext): Promise<void>
  getSupportedWallets(): Promise<EIP6963ProviderInfo[]>
  connect(info: EIP6963ProviderInfo): Promise<boolean>
  addConnection(info: EIP6963ProviderInfo): Promise<boolean>
  disconnect(): Promise<boolean>
  setChainIds(chainIds: ChainId[]): void
  getDataAdapter(info: EIP6963ProviderInfo): IDataAdapter
  setActiveAddress(info: EIP6963ProviderInfo, address: Address): Promise<void>
  writeContract(params: WriteContractParameters): Promise<WriteContractReturnType>
  signTypedData(typeData: SignTypedDataParameters): Promise<`0x${string}`>
  private setActiveAddressInner
  private connectSafe
  private restoreConnectSafe
  private restoreChainId
  private restoreWalletConnection
  private restoreWalletConnectionNotActiveWallet
  private restoreWalletConnectionActiveWallet
  private initWallets
  private afterConnectWallet
}
