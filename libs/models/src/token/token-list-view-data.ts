import { ICrossChainTokensBindingRecord } from '../database'

export interface ITokenListViewData {
  userTokensInfo: ICrossChainTokensBindingRecord[]
  allTokensInfo: ICrossChainTokensBindingRecord[]
}
