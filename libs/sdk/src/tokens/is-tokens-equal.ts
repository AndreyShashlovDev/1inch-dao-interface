import { IToken } from '@1inch-community/models'
import { isAddressEqual } from 'viem'

export function isTokensEqual(token1: IToken | null, token2: IToken | null): boolean {
  const isAddressMatching = isAddressEqual(token1?.address ?? '0x', token2?.address ?? '0x')
  const isChainIdMatching = token1?.chainId === token2?.chainId

  return isAddressMatching && isChainIdMatching
}
