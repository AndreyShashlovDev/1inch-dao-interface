import { TokenRecordId } from './token-record'

export interface ICrossChainTokensBindingRecord {
  symbol: string
  priority: number
  tokenRecordIds: TokenRecordId[]
}
