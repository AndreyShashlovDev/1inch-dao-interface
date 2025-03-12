import { ChainId, IPersistSyncStorage } from '@1inch-community/models'
import { Address } from 'viem'
export declare function setChainIdInStorage(storage: IPersistSyncStorage, chainId: ChainId): void
export declare function getChainIdsFromStorage(storage: IPersistSyncStorage): ChainId[] | null
export declare function setActiveAddress(storage: IPersistSyncStorage, address: Address): void
export declare function getActiveAddress(storage: IPersistSyncStorage): Address | null
export declare function setActiveWallet(storage: IPersistSyncStorage, id: string | null): void
export declare function getActiveWallet(storage: IPersistSyncStorage): string | null
export declare function addConnectedWallet(storage: IPersistSyncStorage, id: string): void
export declare function getConnectedWallet(storage: IPersistSyncStorage): any
export declare function removeConnectedWallet(storage: IPersistSyncStorage, id: string): void
