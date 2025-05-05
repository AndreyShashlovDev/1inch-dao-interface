import {
  IAmountDataSource,
  ICryptoAssetDataProvider,
  IOnChain,
  ITokenStorage,
  IWallet,
} from '@1inch-community/models'
import { isNativeToken } from '../chain'
import { PairHolder } from './pair-holder'

export class AmountDataSourceImpl implements IAmountDataSource {
  constructor(
    private readonly pairHolder: PairHolder,
    private readonly oneInchApiAdapter: ICryptoAssetDataProvider,
    private readonly wallet: IWallet,
    private readonly tokenStorage: ITokenStorage,
    private readonly onChain: IOnChain
  ) {}

  public async getMaxAmount(): Promise<bigint> {
    const snapshot = this.pairHolder.getSnapshot('source')
    const sourceToken = snapshot.token
    const connectedWalletAddress = await this.wallet.data.getActiveAddress()
    if (!sourceToken || !connectedWalletAddress) return 0n
    const balance = await this.tokenStorage.getTokenBalance(
      sourceToken.chainId,
      sourceToken.address,
      connectedWalletAddress
    )
    let amount = BigInt(balance?.amount ?? 0)
    if (isNativeToken(sourceToken.address)) {
      const chainId = await this.wallet.data.getChainId()
      if (!chainId) return 0n
      const [gasUnits, gasPriceDTO] = await Promise.all([
        this.onChain.estimateWrapNativeToken(chainId, amount),
        this.oneInchApiAdapter.getGasPrice(chainId),
      ])
      if (!gasPriceDTO) return 0n
      const gasPrice = gasPriceDTO.high
      const fee = gasUnits * (BigInt(gasPrice.maxFeePerGas) + BigInt(gasPrice.maxPriorityFeePerGas))
      amount = amount - fee
      if (amount < 0n) {
        amount = 0n
      }
    }
    return amount
  }
}
