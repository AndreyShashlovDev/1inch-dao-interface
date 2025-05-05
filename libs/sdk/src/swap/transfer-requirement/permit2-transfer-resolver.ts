import {
  ChainId,
  EmptyResult,
  IOnChain,
  ITransferRequirementResolver,
  IWallet,
  ResolverStep,
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

interface SingResult extends EmptyResult {
  signature: string | undefined
}

export type StepResultMap = {
  ApproveTokenForPermit: EmptyResult
  ApproveSpenderForPermit: EmptyResult
  SignPermit: SingResult
}

export type StepName = keyof StepResultMap
export type StepResult<S extends StepName> = StepResultMap[S]

export class Permit2TransferResolver
  implements ITransferRequirementResolver<StepName, StepResult<StepName>>
{
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
    token: Address,
    amount: bigint
  ): Promise<boolean> {
    return await this.checkPermitAllowance(chainId, walletAddress, token, amount)
  }

  async provideRequirements(
    chainId: ChainId,
    walletAddress: Address,
    token: Address,
    amount: bigint
  ): Promise<ResolverStep<StepName, StepResult<StepName>>[]> {
    const isPermit2Supported = await this.supportPermit2ContractForChain(chainId)

    if (!isPermit2Supported) {
      throw new Error(`Permit2 is not supported for chain ${chainId}`)
    }

    const hasBalance = await this.hasEnoughTokenBalance(chainId, walletAddress, token, amount)

    if (!hasBalance) {
      throw new Error(`Insufficient token balance for ${token}`)
    }

    const permit2Status = await this.checkPermit2Status(chainId, walletAddress, token, amount)

    if (
      permit2Status.isPermit2Approved &&
      permit2Status.isAmountSufficient &&
      !permit2Status.isExpired
    ) {
      return []
    }

    const steps: ResolverStep<StepName, StepResult<StepName>>[] = []

    if (!permit2Status.isTokenApprovedForPermit2) {
      steps.push({
        alias: 'ApproveTokenForPermit',
        wait: () => this.approveTokenStep(chainId, walletAddress, token),
      })
    }

    if (!permit2Status.isPermit2Approved) {
      steps.push({
        alias: 'ApproveSpenderForPermit',
        wait: () => this.approveSpenderStep(chainId, walletAddress, token, amount),
      })
    }

    steps.push({
      alias: 'SignPermit',
      wait: () => this.signPermit2Step(chainId, walletAddress, token, amount, permit2Status.nonce),
    })

    return steps
  }

  private async approveTokenStep(
    chainId: ChainId,
    walletAddress: Address,
    token: Address
  ): Promise<EmptyResult> {
    const canApprove = await this.canPerformApprove(chainId, walletAddress, token)

    if (!canApprove) {
      return { status: 'error', error: new Error('Cannot approve token for Permit2') }
    }

    try {
      await this.approveTokenForPermit2(chainId, walletAddress, token)
      return { status: 'success' }
    } catch (e) {
      return { status: 'error', error: new Error('Failed to approve token for Permit2') }
    }
  }

  private async approveSpenderStep(
    chainId: ChainId,
    walletAddress: Address,
    token: Address,
    amount: bigint
  ): Promise<EmptyResult> {
    const now = Math.floor(Date.now() / 1000)
    const expiration = BigInt(now + this.DEFAULT_PERMIT_EXPIRATION)
    const spender = getOneInchRouterV6ContractAddress(chainId)

    try {
      await this.approvePermit2ForRouter(chainId, walletAddress, token, spender, amount, expiration)
      return { status: 'success' }
    } catch (e) {
      return { status: 'error', error: new Error('Failed to approve Permit2 for router') }
    }
  }

  private async signPermit2Step(
    chainId: ChainId,
    walletAddress: Address,
    token: Address,
    amount: bigint,
    permit2Nonce: number
  ): Promise<SingResult> {
    const now = Math.floor(Date.now() / 1000)
    const expiration = BigInt(now + this.DEFAULT_PERMIT_EXPIRATION)
    const sigDeadline = BigInt(now + this.DEFAULT_SIG_DEADLINE)

    const spender = getOneInchRouterV6ContractAddress(chainId)

    try {
      const permitSignature = await this.createPermit2Signature(
        chainId,
        walletAddress,
        token,
        spender,
        amount,
        expiration,
        sigDeadline,
        permit2Nonce
      )

      return { signature: permitSignature.signature, status: 'success' }
    } catch (e) {
      return {
        signature: undefined,
        status: 'error',
        error: new Error(`Token approved for Permit2, but Permit2 signature failed for ${token}.`),
      }
    }
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
  }

  private async approvePermit2ForRouter(
    chainId: ChainId,
    walletAddress: Address,
    tokenAddress: Address,
    spenderAddress: Address,
    amount: bigint,
    expiration: bigint
  ): Promise<boolean> {
    const permit2Address = this.getPermit2ContractAddress(chainId)

    const wcp: WriteContractParameters = {
      account: walletAddress,
      chain: undefined,
      abi: PERMIT2_ABI,
      address: permit2Address,
      functionName: 'approve',
      args: [tokenAddress, spenderAddress, amount, expiration],
    }

    const hash = await this.wallet.writeContract(wcp)
    await this.onChainService.waitTransaction(chainId, hash)

    const client = await this.onChainService.getClient(chainId)
    const [newAllowance] = await client.readContract({
      abi: PERMIT2_ABI,
      address: permit2Address,
      functionName: 'allowance',
      args: [walletAddress, tokenAddress, spenderAddress],
    })

    return newAllowance >= amount
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
      throw new Error('Failed to sign Permit2 data')
    }

    return {
      signature,
      permitData: {
        permitSingle,
        signature,
      },
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
