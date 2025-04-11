import { TokenRecordId } from './token-record'

export interface ICrossChainTokensBindingRecord {
  symbol: string
  priority: number
  chainCount: number
  tokenRecordIds: TokenRecordId[]
}
