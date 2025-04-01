import { Observable } from 'rxjs'
import {
  Address,
  Block,
  BlockTag,
  Hash,
  PublicClient,
  Transaction,
  WriteContractParameters,
} from 'viem'
import { InitializingEntity } from '../base'
import { ChainId } from './chain-id'

export interface IOnChain extends InitializingEntity {
  readonly crossChainEmitter: Observable<void>
  getClient(chainId: ChainId): Promise<PublicClient>
  getBlockEmitter(chainId: ChainId): Observable<Block>
  getAllowance(chainId: ChainId, token: Address, owner: Address, spender: Address): Promise<bigint>
  waitTransaction(chainId: ChainId, hash: Hash, blockTag?: BlockTag): Promise<Transaction>
  simulateApprove(
    chainId: ChainId,
    token: Address,
    owner: Address,
    spender: Address,
    value: bigint
  ): Promise<WriteContractParameters>
  estimateWrapNativeToken(chainId: ChainId, value: bigint): Promise<bigint>
  simulateWrapNativeToken(chainId: ChainId, value: bigint): Promise<WriteContractParameters>
}
