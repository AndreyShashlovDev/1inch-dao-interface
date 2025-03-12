import { EIP1193Provider, EventMap, RequestArguments } from '@1inch-community/models'
import { Address } from 'viem'
export declare class MultiConnectProvider implements EIP1193Provider {
  static connect(): Promise<MultiConnectProvider>
  static restoreConnect(): Promise<MultiConnectProvider>
  private readonly storage
  private activeAddress
  private readonly eventEmitter
  private get signer()
  get chainId(): number
  connect(): Promise<void>
  restoreConnect(): Promise<void>
  setActiveAddress(address: Address | null): void
  disconnect(): Promise<void>
  isConnected(): boolean
  request(args: RequestArguments): Promise<unknown>
  enable(): Promise<Address[]>
  on<TEvent extends keyof EventMap>(
    event: TEvent,
    listener: (result: EventMap[TEvent]) => void
  ): void
  removeListener<TEvent extends keyof EventMap>(
    event: TEvent,
    listener: (result: EventMap[TEvent]) => void
  ): void
  private updatePersist
  private getPersistData
  private getAddresses
  private listenEvents
  private cleanOldStorage
}
