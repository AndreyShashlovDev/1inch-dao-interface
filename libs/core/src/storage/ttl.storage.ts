import { IApplicationContext, InitializingEntity } from '@1inch-community/models'
import { JsonParser } from './storage.manager'

type ExpireFnOrTime<ExpireProps> = number | ((props: ExpireProps) => number)

export class TTLStorage<Key, ExpireProps = unknown> implements InitializingEntity {
  private context?: IApplicationContext
  private lastUpdateTimestampMap: Map<Key, number> = new Map()

  constructor(
    private readonly key: string,
    private readonly expireFnOrTime: ExpireFnOrTime<ExpireProps>
  ) {}

  async init(context: IApplicationContext): Promise<void> {
    this.context = context
    const state = this.context.storage.get<[Key, number][]>(this.key, JsonParser)
    this.lastUpdateTimestampMap = new Map(state ?? [])
  }

  update(key: Key) {
    if (!this.context)
      throw new Error('TtlController Error: update impossible, context not initialized')
    const timestamp = Date.now()
    this.lastUpdateTimestampMap.set(key, timestamp)
    this.context.storage.set(this.key, [...this.lastUpdateTimestampMap.entries()])
  }

  isExpired(key: Key, props?: ExpireProps): boolean {
    const expire =
      typeof this.expireFnOrTime === 'function'
        ? this.expireFnOrTime(props as ExpireProps)
        : this.expireFnOrTime
    const lastUpdateTimestamp = this.lastUpdateTimestampMap.get(key)
    if (!lastUpdateTimestamp) return true
    return Date.now() - lastUpdateTimestamp > expire
  }
}
