import { lazyAppContext } from '@1inch-community/core/lazy'
import { objectsEqual } from '@1inch-community/core/utils'
import {
  ChainId,
  EIP6963ProviderDetail,
  EIP6963ProviderInfo,
  IApplicationContext,
  IDataAdapter,
  IWallet,
  IWalletAdapter,
  IWalletInternal,
} from '@1inch-community/models'
import { debounceTime, defaultIfEmpty, fromEvent, Subject, take, takeUntil, tap, timer } from 'rxjs'
import type {
  Address,
  SignTypedDataParameters,
  WriteContractParameters,
  WriteContractReturnType,
} from 'viem'
import { adapterId } from './adapter-id'
import { UniversalBrowserExtensionAdapter } from './adapters/universal-browser-extension-adapter'
import {
  getWalletConnectProviderDetail,
  WalletConnectV2Adapter,
} from './adapters/wallet-connect-v2-adapter'
import { GlobalDataAdapter } from './global-data-adapter'
import { getInjectedProviderDetail, getInjectedProviderSupported } from './injected-provider-detail'
import {
  addConnectedWallet,
  getActiveAddress,
  getActiveWallet,
  getChainIdsFromStorage,
  getConnectedWallet,
  removeConnectedWallet,
  setActiveWallet,
} from './storage'

export class WalletController implements IWallet, IWalletInternal {
  private readonly context = lazyAppContext('WalletController')

  readonly data = new GlobalDataAdapter(this)

  readonly activeAdapters = new Map<string, IWalletAdapter>()
  readonly update$ = new Subject<void>()

  private currentActiveAdapterId: string | null = null
  private readonly adapters = new Map<string, IWalletAdapter>()

  get isConnected(): boolean {
    return this.currentActiveAdapter !== null
  }

  get connectedWalletInfo() {
    return this.currentActiveAdapter?.info ?? null
  }

  get currentActiveAdapter(): IWalletAdapter | null {
    if (!this.currentActiveAdapterId) return null
    return this.activeAdapters.get(this.currentActiveAdapterId) ?? null
  }

  async init(context: IApplicationContext): Promise<void> {
    this.context.set(context)
    // todo: use Promise.all for app start speed up
    await this.data.init(context)
    await this.initWallets()
    this.restoreChainId()
    await this.restoreWalletConnection()
    this.update$.next()
  }

  async getSupportedWallets() {
    const info: EIP6963ProviderInfo[] = []
    this.adapters.forEach((adapter) => info.push(adapter.data.getInfo()))
    return info.sort((info1, info2) => {
      const id1 = adapterId(info1)
      const id2 = adapterId(info2)
      if (id1 === this.currentActiveAdapterId && id2 !== this.currentActiveAdapterId) {
        return -1
      }
      if (id1 !== this.currentActiveAdapterId && id2 === this.currentActiveAdapterId) {
        return 1
      }
      if (this.activeAdapters.has(id1) && this.activeAdapters.has(id2)) {
        return 0
      }
      if (this.activeAdapters.has(id1) && !this.activeAdapters.has(id2)) {
        return -1
      }
      if (!this.activeAdapters.has(id1) && this.activeAdapters.has(id2)) {
        return 1
      }

      return 0
    })
  }

  async connect(info: EIP6963ProviderInfo) {
    const chainId = await this.data.getChainId()
    const id = adapterId(info)
    if (!this.adapters.has(id)) {
      throw new Error(`Invalid wallet info ${info.name} not exist`)
    }
    const connectState = await this.connectSafe(chainId, id)
    this.afterConnectWallet(connectState, id)
    this.update$.next()
    return connectState
  }

  async addConnection(info: EIP6963ProviderInfo): Promise<boolean> {
    const chainId = await this.data.getChainId()
    const id = adapterId(info)
    if (!this.adapters.has(id)) {
      throw new Error(`Invalid wallet info ${info.name} not exist`)
    }
    const adapter: IWalletAdapter | undefined = this.adapters.get(id)
    if (!adapter) {
      throw new Error(`Invalid wallet id`)
    }
    if (!this.activeAdapters.has(id)) {
      throw new Error(`Wallet adapter ${info.name} not connected`)
    }
    let connectState: boolean
    try {
      connectState = await adapter.connect(chainId)
    } catch {
      connectState = false
    }

    this.update$.next()
    return connectState
  }

  async disconnect() {
    if (this.currentActiveAdapter === null) return true
    try {
      const state = await this.currentActiveAdapter.disconnect()
      this.currentActiveAdapterId && this.activeAdapters.delete(this.currentActiveAdapterId)
      this.currentActiveAdapterId &&
        removeConnectedWallet(this.context.value.storage, this.currentActiveAdapterId)
      this.currentActiveAdapterId = null
      this.update$.next()
      return state
    } catch (error) {
      console.error(error)
      return false
    }
  }

  setChainIds(chainIds: ChainId[]) {
    this.data.setChainIds(chainIds)
  }

  getDataAdapter(info: EIP6963ProviderInfo): IDataAdapter {
    const id = adapterId(info)
    const adapter: IWalletAdapter | undefined = this.adapters.get(id)
    if (!adapter) {
      throw new Error(`Invalid wallet info ${info.name} not exist`)
    }
    return adapter.data
  }

  async setActiveAddress(info: EIP6963ProviderInfo, address: Address) {
    const id = adapterId(info)
    return await this.setActiveAddressInner(id, address)
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

  private async setActiveAddressInner(id: string, address: Address) {
    let state = true
    if (this.currentActiveAdapterId !== id) {
      const chainId = await this.data.getChainId()
      if (!this.adapters.has(id)) {
        throw new Error(`Invalid wallet not exist`)
      }
      state = await this.connectSafe(chainId, id)
      this.afterConnectWallet(state, id)
    }
    if (state) {
      this.currentActiveAdapter?.setActiveAddress(address)
    }
    this.update$.next()
  }

  private async connectSafe(chainId: ChainId, walletId: string, retry = false): Promise<boolean> {
    const adapter: IWalletAdapter | undefined = this.adapters.get(walletId)
    if (!adapter) {
      throw new Error(`Invalid wallet id`)
    }
    let connectState: boolean
    if (!this.activeAdapters.has(walletId) || retry) {
      try {
        connectState = await adapter.connect(chainId)
      } catch {
        connectState = false
      }
      connectState && this.activeAdapters.set(walletId, adapter)
    } else {
      connectState = await adapter.isConnected()
      if (!retry && !connectState) {
        connectState = await this.connectSafe(chainId, walletId, true)
      }
    }
    return connectState
  }

  private async restoreConnectSafe(
    chainId: ChainId,
    walletId: string,
    force: boolean
  ): Promise<boolean> {
    const adapter: IWalletAdapter | undefined = this.adapters.get(walletId)
    if (!adapter) {
      throw new Error(`Invalid wallet id`)
    }
    let connectState: boolean
    if (!this.activeAdapters.has(walletId)) {
      try {
        connectState = await adapter.restoreConnect(chainId, force)
      } catch {
        connectState = false
      }
      connectState && this.activeAdapters.set(walletId, adapter)
    } else {
      connectState = await adapter.isConnected()
    }
    return connectState
  }

  private restoreChainId() {
    const chainIds = getChainIdsFromStorage(this.context.value.storage)
    if (!chainIds) return
    this.setChainIds(chainIds)
  }

  private async restoreWalletConnection() {
    const activeWalletId = getActiveWallet(this.context.value.storage)
    const connectedWallet: string[] | null = getConnectedWallet(this.context.value.storage)
    if (!connectedWallet) return
    await this.getSupportedWallets()
    const chainId = await this.data.getChainId()

    await this.restoreWalletConnectionNotActiveWallet(chainId, activeWalletId, connectedWallet)

    await this.restoreWalletConnectionActiveWallet(chainId, activeWalletId)
  }

  private async restoreWalletConnectionNotActiveWallet(
    chainId: ChainId,
    activeWalletId: string | null,
    connectedWallet: string[]
  ) {
    for (const id of connectedWallet) {
      if (id === activeWalletId) continue
      if (!this.adapters.has(id)) continue
      const connectState = await this.restoreConnectSafe(chainId, id, false).catch(() => false)
      this.afterConnectWallet(connectState, id)
    }
  }

  private async restoreWalletConnectionActiveWallet(
    chainId: ChainId,
    activeWalletId: string | null
  ) {
    if (!activeWalletId || !this.adapters.has(activeWalletId)) return
    const connectState = await this.restoreConnectSafe(chainId, activeWalletId, true)
    this.afterConnectWallet(connectState, activeWalletId)
    if (!connectState) return
    const activeAddressFromStore = getActiveAddress(this.context.value.storage)
    if (!activeAddressFromStore || !this.currentActiveAdapter) return
    const addresses = await this.currentActiveAdapter.data.getAddresses()
    if (!addresses.includes(activeAddressFromStore)) return
    await this.setActiveAddressInner(activeWalletId, activeAddressFromStore)
  }

  private initWallets() {
    return new Promise<void>((resolve) => {
      let skipInjectedProvider = false
      fromEvent<CustomEvent<EIP6963ProviderDetail>>(window, 'eip6963:announceProvider')
        .pipe(
          tap((event) => {
            skipInjectedProvider = objectsEqual(window.ethereum, event.detail.provider)
            const id = adapterId(event.detail.info)
            if (!this.adapters.has(id)) {
              this.adapters.set(id, new UniversalBrowserExtensionAdapter(event.detail))
            }
          }),
          debounceTime(100),
          take(1),
          takeUntil(timer(100)),
          defaultIfEmpty(null),
          tap(async () => {
            if (!skipInjectedProvider && getInjectedProviderSupported()) {
              const injectedProviderDetail = await getInjectedProviderDetail()
              const id = adapterId(injectedProviderDetail.info)
              if (!this.adapters.has(id)) {
                this.adapters.set(id, new UniversalBrowserExtensionAdapter(injectedProviderDetail))
              }
            }
            const wc = await getWalletConnectProviderDetail()
            const wcId = adapterId(wc.info)
            this.adapters.set(wcId, new WalletConnectV2Adapter(wc))
            resolve()
          })
        )
        .subscribe()
      window.dispatchEvent(new Event('eip6963:requestProvider'))
    })
  }

  private afterConnectWallet(connectState: boolean, id: string) {
    if (connectState) {
      this.currentActiveAdapterId = id
      addConnectedWallet(this.context.value.storage, id)
      setActiveWallet(this.context.value.storage, id)
    } else {
      removeConnectedWallet(this.context.value.storage, id)
      const currentActiveWalletIdFromStore = getActiveWallet(this.context.value.storage)
      if (currentActiveWalletIdFromStore === id) {
        setActiveWallet(this.context.value.storage, null)
      }
      if (this.currentActiveAdapterId === id) {
        this.currentActiveAdapterId = null
      }
      if (this.activeAdapters.has(id)) {
        const adapter = this.adapters.get(id)!
        adapter.disconnect().catch()
        this.activeAdapters.delete(id)
      }
    }
  }
}
