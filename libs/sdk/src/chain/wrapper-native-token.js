import { getWrapperNativeTokenAddress } from './contracts'
import { getChainById } from './viem-chain-map'
export function getWrapperNativeToken(chainId) {
  const chain = getChainById(chainId)
  return {
    chainId,
    symbol: `W${chain.nativeCurrency.symbol}`,
    name: `W${chain.nativeCurrency.symbol}`,
    decimals: chain.nativeCurrency.decimals,
    address: getWrapperNativeTokenAddress(chainId),
    isInternalWrapToken: true,
  }
}
export function getSymbolFromWrapToken(token) {
  if (token.isInternalWrapToken) {
    return token.symbol.slice(1)
  }
  return token.symbol
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3JhcHBlci1uYXRpdmUtdG9rZW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ3cmFwcGVyLW5hdGl2ZS10b2tlbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sa0JBQWtCLENBQUE7QUFDL0MsT0FBTyxFQUFFLDRCQUE0QixFQUFFLE1BQU0sYUFBYSxDQUFBO0FBRTFELE1BQU0sVUFBVSxxQkFBcUIsQ0FBQyxPQUFnQjtJQUNwRCxNQUFNLEtBQUssR0FBRyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUE7SUFDbkMsT0FBTztRQUNMLE9BQU87UUFDUCxNQUFNLEVBQUUsSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRTtRQUN6QyxJQUFJLEVBQUUsSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRTtRQUN2QyxRQUFRLEVBQUUsS0FBSyxDQUFDLGNBQWMsQ0FBQyxRQUFRO1FBQ3ZDLE9BQU8sRUFBRSw0QkFBNEIsQ0FBQyxPQUFPLENBQUM7UUFDOUMsbUJBQW1CLEVBQUUsSUFBSTtLQUMxQixDQUFBO0FBQ0gsQ0FBQztBQUVELE1BQU0sVUFBVSxzQkFBc0IsQ0FBQyxLQUFhO0lBQ2xELElBQUksS0FBSyxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFDOUIsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUM5QixDQUFDO0lBQ0QsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFBO0FBQ3JCLENBQUMifQ==
