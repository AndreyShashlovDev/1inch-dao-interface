import type { EthereumProviderOptions } from '@walletconnect/ethereum-provider'
import { default as WcEthereumProvider } from '@walletconnect/ethereum-provider'
export interface EthereumRpcMap {
  [chainId: string]: string
}
export interface ConnectOps {
  chains?: number[]
  optionalChains?: number[]
  rpcMap?: EthereumRpcMap
  pairingTopic?: string
}
export declare class EthereumProvider extends WcEthereumProvider {
  private readonly persistStorePrefix
  static initProvider(
    opts: EthereumProviderOptions,
    persistStorePrefix: string
  ): Promise<EthereumProvider>
  constructor(persistStorePrefix: string)
  connect(opts?: ConnectOps): Promise<void>
  protected initialize(opts: EthereumProviderOptions): Promise<void>
  disconnect(): Promise<void>
  dropPersist(): Promise<void>
}
export declare class WalletConnectStorage {
  static dropStorage(persistStorePrefix: string): Promise<void>
  static dropStorageByName(name: string): Promise<void>
  static getDatabaseName(persistStorePrefix: string): string
  static init(persistStorePrefix: string): Promise<WalletConnectStorage>
  private data
  private dexie
  init(name: string): Promise<this>
  dropStorage(): Promise<void>
  getKeys(): Promise<string[]>
  getEntries<T = unknown>(): Promise<[string, T][]>
  getItem<T = unknown>(key: string): Promise<T | undefined>
  setItem<T = unknown>(key: string, value: T): Promise<void>
  removeItem(key: string): Promise<void>
}
export declare function getEthereumChainId(chains: string[]): number
