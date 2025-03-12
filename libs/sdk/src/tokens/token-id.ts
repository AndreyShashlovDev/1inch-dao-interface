import { ChainId, TokenId } from '@1inch-community/models'
import { Address, isAddress } from 'viem'
import { isChainId } from '../chain'

const separator = ':'

export function buildTokenId(chainId: ChainId, tokenAddress: Address): TokenId {
  return `${chainId}${separator}${tokenAddress}`
}

export function divideTokenId(tokenId: TokenId): [ChainId, Address] {
  const [chainId, tokenAddress] = tokenId.split(separator)
  if (!isAddress(tokenAddress) || !isChainId(chainId)) {
    throw new Error(`token id ${tokenId} is not valid`)
  }
  return [chainId, tokenAddress]
}
