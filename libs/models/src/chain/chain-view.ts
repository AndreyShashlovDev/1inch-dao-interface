import { ChainId } from './chain-id'

export type ChainViewInfo = {
  name: string
  iconName: string
  color: [string, string]
  priority?: number
}

export type ChainViewFull = {
  chainId: ChainId
} & ChainViewInfo
