import { Observable } from 'rxjs'
import { InitializingEntity } from '../base'
import { ChainId } from '../chain'
import { IToken } from '../token'
import { Rate } from './rate'

export interface ITokenRateProvider extends InitializingEntity {
  getOnChainRate(
    chainId: ChainId,
    sourceToken: IToken,
    destinationToken: IToken
  ): Promise<Rate | null>
  listenOnChainRate(
    chainId: ChainId,
    sourceToken: IToken,
    destinationToken: IToken
  ): Observable<Rate | null>
}
