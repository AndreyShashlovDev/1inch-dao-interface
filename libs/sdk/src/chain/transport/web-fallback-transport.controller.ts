import { CacheActivePromise } from '@1inch-community/core/decorators'
import { lazyAppContext } from '@1inch-community/core/lazy'
import { IApplicationContext, InitializingEntity } from '@1inch-community/models'
import { Chain, createTransport, http, Transport, webSocket } from 'viem'

interface RpcConfig {
  batchSize: number
}

export type HTTPS = `https://${string}`
export type WS = `wss://${string}`
export type RPC_URL = HTTPS | WS
export type RPC = RPC_URL | { rpc: RPC_URL; config: RpcConfig }

interface TransportHolder {
  type: 'ws' | 'http'
  chain: Chain
  rpc: RPC_URL
  config: RpcConfig
  transport: ReturnType<Transport>
  success: boolean
  time: number
  countErrors: number
}

const defaultRPCConfig: RpcConfig = {
  batchSize: 100,
}

export class WebFallbackTransportController implements InitializingEntity {
  private readonly httpTransportSet = new Set<TransportHolder>()
  private readonly wsTransportSet = new Set<TransportHolder>()
  private readonly context = lazyAppContext('WebFallbackTransportController')

  constructor(private readonly chain: Chain) {}

  async init(context: IApplicationContext) {
    this.context.set(context)
    await this.initRPC()
  }

  @CacheActivePromise()
  async benchMartTransport() {
    await Promise.all([
      ...this.httpTransportSet.values().toArray().map(benchMartTransport),
      ...this.wsTransportSet.values().toArray().map(benchMartTransport),
    ])
  }

  createTransport(): Transport {
    return () =>
      createTransport(
        {
          key: 'fallback',
          name: 'fallback',
          type: 'fallback',
          request: ({ method, params }) => this.onRequest(method, params),
        },
        {}
      )
  }

  @CacheActivePromise()
  private async onRequest(method: string, params: unknown): Promise<any> {
    return await this.fetch(method, params)
  }

  private async fetch(method: string, params: unknown): Promise<any> {
    const { http, ws } = this.getBestTransport()
    try {
      const result = await Promise.any([
        http
          ? request(http, method, params)
          : Promise.reject(new Error('No http transports available')),
        ws ? request(ws, method, params) : Promise.reject(new Error('No ws transports available')),
      ])
      return result
    } catch (error) {
      if (error instanceof AggregateError) {
        return
      }
      throw error
    }
  }

  private async initRPC() {
    const { getRPC } = await import('../transport-map')
    const { http, ws } = getRPC(this.chain.id)
    const httpTransportHolderList = buildTransportHolderList(this.chain, http)
    const wsTransportHolderList = buildTransportHolderList(this.chain, ws)
    httpTransportHolderList.forEach((item) => this.httpTransportSet.add(item))
    wsTransportHolderList.forEach((item) => this.wsTransportSet.add(item))
  }

  private getBestTransport(): { ws?: TransportHolder; http?: TransportHolder } {
    const bestTransport: { http?: TransportHolder; ws?: TransportHolder } = {
      http: undefined,
      ws: undefined,
    }

    this.httpTransportSet.forEach(
      (transport) => (bestTransport.http = compareTransportHolder(transport, bestTransport.http))
    )
    this.wsTransportSet.forEach(
      (transport) => (bestTransport.ws = compareTransportHolder(transport, bestTransport.ws))
    )

    return bestTransport
  }
}

function compareTransportHolder(
  th1: TransportHolder,
  th2?: TransportHolder
): TransportHolder | undefined {
  if (!th1.success) {
    return th2
  }
  if (th2 === undefined) {
    return th1
  }
  if (th2.countErrors > th1.countErrors) {
    return th1
  }
  if (th2.time > th1.time) {
    return th1
  }
  return th2
}

async function request(
  transportHolder: TransportHolder,
  method: string,
  params?: unknown
): Promise<unknown> {
  const { transport } = transportHolder
  return await transport
    .request({ method, params }, { dedupe: true, retryCount: 0 })
    .catch((err) => {
      transportHolder.countErrors++
      return Promise.reject(err)
    })
}

async function benchMartTransport(transportHolder: TransportHolder): Promise<void> {
  const { rpc, config, chain, type, transport } = transportHolder
  const _transport =
    type === 'ws'
      ? transport
      : buildTransport(chain, buildTransportFactory(rpc, { ...config, batchSize: false }))
  const start = Date.now()
  let end: number
  try {
    transportHolder.success = await _transport
      .request({ method: 'net_listening' })
      .catch(() => _transport.request({ method: 'web3_clientVersion' }))
      .catch(() => _transport.request({ method: 'eth_blockNumber' }))
      .catch(() => _transport.request({ method: 'net_version' }))
      .catch(() => _transport.request({ method: 'eth_syncing' }))
      .then((result) => {
        return !!result
      })
  } catch {
    transportHolder.success = false
    // console.groupCollapsed('RPC bench mart error', rpc)
    // console.error('chain: ', chain.id, chain.name)
    // console.error('rpc: ', rpc)
    // console.error(error)
    // console.groupEnd()
  } finally {
    end = Date.now()
    transportHolder.time = end - start
  }
}

function buildTransportHolderList(chain: Chain, rpcList: RPC[]): TransportHolder[] {
  return rpcList.map((rpcAndConfig) => {
    const rpc = typeof rpcAndConfig === 'string' ? rpcAndConfig : rpcAndConfig.rpc
    const config = typeof rpcAndConfig === 'string' ? defaultRPCConfig : rpcAndConfig.config
    return {
      chain,
      rpc,
      config,
      countErrors: 0,
      type: rpc.startsWith('https://') ? 'http' : 'ws',
      transport: buildTransport(chain, buildTransportFactory(rpc, config)),
      success: true,
      time: Infinity,
    }
  })
}

function buildTransportFactory(
  rpc: RPC_URL,
  config: Omit<RpcConfig, 'batchSize'> & {
    batchSize: number | false
  }
): Transport {
  if (rpc.startsWith('https://')) {
    return http(rpc, {
      retryCount: 0,
      timeout: 3_000,
      batch:
        config.batchSize === false
          ? undefined
          : {
              batchSize: config.batchSize,
              wait: 300,
            },
    })
  }
  if (rpc.startsWith('wss://')) {
    return webSocket(rpc, {
      retryCount: 1,
      retryDelay: 1_000,
      timeout: 10_000,
      reconnect: false,
    })
  }
  throw new Error(`Unsupported RPC URL ${rpc}`)
}

function buildTransport(chain: Chain, transportFactory: Transport): ReturnType<Transport> {
  return transportFactory({
    chain,
    retryCount: 0,
    timeout: 2_000,
    pollingInterval: 0,
  })
}
