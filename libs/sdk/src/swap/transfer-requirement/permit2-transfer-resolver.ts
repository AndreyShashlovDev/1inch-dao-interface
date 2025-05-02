import {
  ChainId,
  IOnChain,
  IToken,
  ITransferRequirementResolver,
  IWallet,
} from '@1inch-community/models'
import {
  Address,
  encodeFunctionData,
  Hex,
  maxUint256,
  parseAbi,
  SignTypedDataParameters,
  WriteContractParameters,
} from 'viem'
import { getOneInchRouterV6ContractAddress, permit2ContractAddress } from '../../chain'

const PERMIT2_ABI = parseAbi([
  'function DOMAIN_SEPARATOR() external view returns (bytes32)',
  'function allowance(address owner, address token, address spender) external view returns (uint160 amount, uint48 expiration, uint48 nonce)',
  'function approve(address token, address spender, uint160 amount, uint48 expiration) external',
])

const ERC20_ABI = parseAbi([
  'function allowance(address owner, address spender) public view returns (uint256)',
  'function approve(address _spender, uint256 _value) public returns (bool success)',
  'function balanceOf(address) view returns (uint256)',
])

interface PermitSingle {
  details: {
    token: Address
    amount: bigint
    expiration: bigint
    nonce: number
  }
  spender: Address
  sigDeadline: bigint
}

interface Permit2Result {
  success: boolean
  signature?: Hex
  error?: string
  permitData?: {
    permitSingle: PermitSingle
    signature: Hex
  }
}

interface Permit2Status {
  isTokenApprovedForPermit2: boolean
  isPermit2Approved: boolean
  isAmountSufficient: boolean
  hasEnoughBalance: boolean
  tokenAllowance: bigint
  permit2Allowance: bigint
  permit2Expiration: number
  currentTimestamp: bigint
  isExpired: boolean
  nonce: number
}

export interface PermitProviderResult {
  signature?: string
}

export class Permit2TransferResolver implements ITransferRequirementResolver<PermitProviderResult> {
  private readonly permit2SupportCache: Map<ChainId, { supported: boolean; timestamp: number }> =
    new Map()
  private readonly DEFAULT_PERMIT_EXPIRATION = 30 * 24 * 60 * 60 // 30 days
  private readonly DEFAULT_SIG_DEADLINE = 60 * 60 // 1 hour

  constructor(
    private readonly onChainService: IOnChain,
    private readonly wallet: IWallet
  ) {}

  async requirementProvided(
    chainId: ChainId,
    walletAddress: Address,
    token: Address | IToken,
    amount: bigint
  ): Promise<boolean> {
    const tokenAddress = typeof token === 'string' ? token : token.address
    return await this.checkPermitAllowance(chainId, walletAddress, tokenAddress, amount)
  }

  async provideRequirements(
    chainId: ChainId,
    walletAddress: Address,
    token: Address | IToken,
    amount: bigint
  ): Promise<PermitProviderResult> {
    const tokenAddress = typeof token === 'string' ? token : token.address
    const isPermit2Supported = await this.supportPermit2ContractForChain(chainId)

    if (!isPermit2Supported) {
      throw new Error(`Permit2 is not supported for chain ${chainId}`)
    }

    const hasBalance = await this.hasEnoughTokenBalance(
      chainId,
      walletAddress,
      tokenAddress,
      amount
    )

    if (!hasBalance) {
      throw new Error(`Insufficient token balance for ${tokenAddress}`)
    }

    const permit2Status = await this.checkPermit2Status(
      chainId,
      walletAddress,
      tokenAddress,
      amount
    )

    if (
      permit2Status.isPermit2Approved &&
      permit2Status.isAmountSufficient &&
      !permit2Status.isExpired
    ) {
      return { signature: undefined }
    }

    let approveSucceeded = permit2Status.isTokenApprovedForPermit2

    if (!approveSucceeded) {
      const canApprove = await this.canPerformApprove(chainId, walletAddress, tokenAddress)

      if (!canApprove) {
        throw new Error('Cannot approve token for Permit2')
      }

      approveSucceeded = await this.approveTokenForPermit2(chainId, walletAddress, tokenAddress)

      if (!approveSucceeded) {
        throw new Error('Failed to approve token for Permit2')
      }
    }

    if (approveSucceeded) {
      const now = Math.floor(Date.now() / 1000)
      const expiration = BigInt(now + this.DEFAULT_PERMIT_EXPIRATION)
      const sigDeadline = BigInt(now + this.DEFAULT_SIG_DEADLINE)

      const spender = getOneInchRouterV6ContractAddress(chainId)
      const permitSignature = await this.createPermit2Signature(
        chainId,
        walletAddress,
        tokenAddress,
        spender,
        amount,
        expiration,
        sigDeadline,
        permit2Status.nonce
      )

      if (!permitSignature.success) {
        throw new Error(
          `Token approved for Permit2, but Permit2 signature failed for ${tokenAddress}. ${permitSignature.error}`
        )
      }

      return { signature: permitSignature.signature }
    }

    throw new Error('cannot make permit')
  }

  private getPermit2ContractAddress(chainId: ChainId): Address {
    return permit2ContractAddress(chainId)
  }

  private async checkPermitAllowance(
    chainId: ChainId,
    walletAddress: Address,
    token: Address,
    amount: bigint
  ): Promise<boolean> {
    const supportChain = await this.supportPermit2ContractForChain(chainId)

    if (!supportChain) {
      return false
    }

    const permit2Address = this.getPermit2ContractAddress(chainId)
    const client = await this.onChainService.getClient(chainId)
    const oneInchRouter = getOneInchRouterV6ContractAddress(chainId)

    const [allowedPermit, expiration] = await client.readContract({
      abi: PERMIT2_ABI,
      address: permit2Address,
      functionName: 'allowance',
      args: [walletAddress, token, oneInchRouter],
    })

    const allowed = await client.readContract({
      abi: ERC20_ABI,
      address: token,
      functionName: 'allowance',
      args: [walletAddress, permit2Address],
    })

    const currentTimestamp = BigInt(Math.floor(Date.now() / 1000))
    const isExpired = expiration <= currentTimestamp

    return allowedPermit >= amount && allowed >= amount && !isExpired
  }

  private async supportPermit2ContractForChain(chainId: ChainId): Promise<boolean> {
    const cachedResult = this.permit2SupportCache.get(chainId)
    const now = Date.now()
    if (cachedResult && now - cachedResult.timestamp < 3600 * 1000) {
      return cachedResult.supported
    }

    try {
      const permit2Address = this.getPermit2ContractAddress(chainId)
      const client = await this.onChainService.getClient(chainId)
      const code = await client.getCode({
        address: permit2Address,
      })

      if (code === '0x' || code === '0x0') {
        this.permit2SupportCache.set(chainId, { supported: false, timestamp: now })
        return false
      }

      try {
        await client.readContract({
          abi: PERMIT2_ABI,
          address: permit2Address,
          functionName: 'DOMAIN_SEPARATOR',
        })

        // Кэшируем положительный результат
        this.permit2SupportCache.set(chainId, { supported: true, timestamp: now })
        return true
      } catch (e) {
        this.permit2SupportCache.set(chainId, { supported: false, timestamp: now })
        return false
      }
    } catch (error) {
      this.permit2SupportCache.set(chainId, { supported: false, timestamp: now })
      return false
    }
  }

  private async hasEnoughTokenBalance(
    chainId: ChainId,
    walletAddress: Address,
    tokenAddress: Address,
    amount: bigint
  ): Promise<boolean> {
    const client = await this.onChainService.getClient(chainId)

    try {
      const balance = await client.readContract({
        abi: ERC20_ABI,
        address: tokenAddress,
        functionName: 'balanceOf',
        args: [walletAddress],
      })

      return balance >= amount
    } catch (error) {
      console.error('Failed to check token balance:', error)
      return false
    }
  }

  private async checkPermit2Status(
    chainId: ChainId,
    walletAddress: Address,
    tokenAddress: Address,
    amount: bigint
  ): Promise<Permit2Status> {
    const permit2Address = this.getPermit2ContractAddress(chainId)
    const client = await this.onChainService.getClient(chainId)
    const oneInchRouter = getOneInchRouterV6ContractAddress(chainId)

    const tokenAllowance = await client.readContract({
      abi: ERC20_ABI,
      address: tokenAddress,
      functionName: 'allowance',
      args: [walletAddress, permit2Address],
    })

    const balance = await client.readContract({
      abi: ERC20_ABI,
      address: tokenAddress,
      functionName: 'balanceOf',
      args: [walletAddress],
    })

    const [permit2Allowance, permit2Expiration, nonce] = await client.readContract({
      abi: PERMIT2_ABI,
      address: permit2Address,
      functionName: 'allowance',
      args: [walletAddress, tokenAddress, oneInchRouter],
    })

    const currentTimestamp = BigInt(Math.floor(Date.now() / 1000))
    const isExpired = permit2Expiration <= currentTimestamp

    return {
      isTokenApprovedForPermit2: tokenAllowance >= amount,
      isPermit2Approved: permit2Allowance >= amount,
      isAmountSufficient: tokenAllowance >= amount && permit2Allowance >= amount,
      hasEnoughBalance: balance >= amount,
      tokenAllowance,
      permit2Allowance,
      permit2Expiration,
      currentTimestamp,
      isExpired,
      nonce,
    }
  }

  private async canPerformApprove(
    chainId: ChainId,
    walletAddress: Address,
    tokenAddress: Address
  ): Promise<boolean> {
    try {
      const permit2Address = this.getPermit2ContractAddress(chainId)
      const client = await this.onChainService.getClient(chainId)

      try {
        await client.estimateGas({
          account: walletAddress,
          to: tokenAddress,
          data: encodeFunctionData({
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [permit2Address, maxUint256],
          }),
        })

        return true
      } catch (error) {
        console.error('Gas estimation failed for approve, transaction would revert:', error)
        return false
      }
    } catch (error) {
      console.error('Error checking approve possibility:', error)
      return false
    }
  }

  private async approveTokenForPermit2(
    chainId: ChainId,
    walletAddress: Address,
    tokenAddress: Address
  ): Promise<boolean> {
    try {
      const permit2Address = this.getPermit2ContractAddress(chainId)

      const wcp: WriteContractParameters = {
        account: walletAddress,
        chain: undefined,
        abi: ERC20_ABI,
        address: tokenAddress,
        functionName: 'approve',
        args: [permit2Address, maxUint256],
      }

      const hash = await this.wallet.writeContract(wcp)
      await this.onChainService.waitTransaction(chainId, hash)

      const currentAllowance = await this.onChainService.getAllowance(
        chainId,
        tokenAddress,
        walletAddress,
        permit2Address
      )

      return currentAllowance >= maxUint256 / 2n
    } catch (error) {
      console.error('Error approving token for Permit2:', error)
      return false
    }
  }

  private async createPermit2Signature(
    chainId: ChainId,
    walletAddress: Address,
    tokenAddress: Address,
    spenderAddress: Address,
    amount: bigint,
    expiration: bigint,
    sigDeadline: bigint,
    nonce: number
  ): Promise<Permit2Result> {
    try {
      const permit2Address = this.getPermit2ContractAddress(chainId)

      const permitSingle: PermitSingle = {
        details: {
          token: tokenAddress,
          amount,
          expiration,
          nonce,
        },
        spender: spenderAddress,
        sigDeadline,
      }

      const domain = await this.getPermit2Domain(permit2Address, chainId)
      const signature = await this.signPermit2(walletAddress, domain, permitSingle)

      if (!signature) {
        return { success: false, error: 'Failed to sign Permit2 data' }
      }

      return {
        success: true,
        signature,
        permitData: {
          permitSingle,
          signature,
        },
      }
    } catch (error) {
      console.error('Error creating Permit2 signature:', error)
      return { success: false, error: `${error}` }
    }
  }

  private async getPermit2Domain(
    permit2Address: Address,
    chainId: ChainId
  ): Promise<{ name: string; version: string; chainId: number; verifyingContract: Address }> {
    return {
      name: 'Permit2',
      version: '1',
      chainId: Number(chainId),
      verifyingContract: permit2Address,
    }
  }

  private async signPermit2(
    account: Address,
    domain: any,
    permitSingle: PermitSingle
  ): Promise<Hex> {
    const types = {
      PermitSingle: [
        { name: 'details', type: 'PermitDetails' },
        { name: 'spender', type: 'address' },
        { name: 'sigDeadline', type: 'uint256' },
      ],
      PermitDetails: [
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint160' },
        { name: 'expiration', type: 'uint48' },
        { name: 'nonce', type: 'uint48' },
      ],
    }

    const signParams: SignTypedDataParameters = {
      account,
      domain,
      types,
      primaryType: 'PermitSingle' as const,
      message: permitSingle as any,
    }

    return await this.wallet.signTypedData(signParams)
  }
}
