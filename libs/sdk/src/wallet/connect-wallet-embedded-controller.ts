import {
  ChainId,
  EIP6963ProviderInfo,
  EmbeddedBootstrapConfig,
  IDataAdapter,
  IWallet,
  IWalletAdapter,
  IWalletInternal,
} from '@1inch-community/models'
import { Observable, Subject } from 'rxjs'
import { SignTypedDataParameters, WriteContractParameters, WriteContractReturnType } from 'viem'
import { adapterId } from './adapter-id'
import { UniversalBrowserExtensionAdapter } from './adapters/universal-browser-extension-adapter'
import { GlobalDataAdapter } from './global-data-adapter'
import { getInjectedProviderDetail } from './injected-provider-detail'

export class ConnectWalletEmbeddedController implements IWallet, IWalletInternal {
  currentActiveAdapter: IWalletAdapter | null = null
  activeAdapters: Map<string, IWalletAdapter> = new Map()

  readonly data = new GlobalDataAdapter(this)
  readonly update$: Subject<void> = new Subject<void>()

  get isConnected(): boolean {
    return true
  }

  get connectedWalletInfo() {
    return this.currentActiveAdapter?.info ?? null
  }

  constructor(private readonly config: EmbeddedBootstrapConfig) {}

  async init(): Promise<void> {
    if (!this.config.walletProvider) return
    const injectedProviderDetail = await getInjectedProviderDetail(this.config.walletProvider)
    const id = adapterId(injectedProviderDetail.info)
    const adapter = new UniversalBrowserExtensionAdapter(injectedProviderDetail)
    this.activeAdapters.set(id, adapter)
    await adapter.connect(this.config.chainId)
    this.currentActiveAdapter = adapter
    this.update$.next()
  }

  async getSupportedWallets(): Promise<EIP6963ProviderInfo[]> {
    const injectedProviderDetail = await getInjectedProviderDetail(this.config.walletProvider)
    return [injectedProviderDetail.info]
  }

  async writeContract(params: WriteContractParameters): Promise<WriteContractReturnType> {
    if (!this.currentActiveAdapter || !this.currentActiveAdapter.client) {
      throw new Error('Wallet not connected')
    }
    return await this.currentActiveAdapter.writeContract(params)
  }

  async signTypedData(typeData: SignTypedDataParameters) {
    if (!this.currentActiveAdapter || !this.currentActiveAdapter.client) {
      throw new Error('Wallet not connected')
    }
    return await this.currentActiveAdapter.signTypedData(typeData)
  }

  setChainIds(chainIds: ChainId[]): void {
    this.data.setChainIds(chainIds)
  }

  connect(): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  addConnection(): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  disconnect(): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  getDataAdapter(): IDataAdapter {
    throw new Error('Method not implemented.')
  }

  setActiveAddress(): Promise<void> {
    throw new Error('Method not implemented.')
  }

  public connectionUriLink(): Observable<string | null> {
    return this.getActiveAdapter().connectionUriLink()
  }

  public async isSupportConnectionUriLink(info: EIP6963ProviderInfo): Promise<boolean> {
    const id = adapterId(info)
    const adapter = this.activeAdapters.get(id)

    return adapter?.isSupportConnectionUriLink() ?? false
  }

  private getActiveAdapter(): IWalletAdapter {
    if (!this.currentActiveAdapter) {
      throw new Error('call init before')
    }

    return this.currentActiveAdapter
  }
}
