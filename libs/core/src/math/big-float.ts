import { IBigFloat } from '@1inch-community/models'
import { smartFormatNumber } from '../formatters'

const BigFloatRegExp = /^BigFloat\((-?\d+(\.\d+)?)\)$/

export class BigFloat implements IBigFloat {
  protected static readonly FIXED_DECIMALS: number = 50

  static from(value: string): IBigFloat
  static from(value: number): IBigFloat
  static from(value: bigint, decimals: number): IBigFloat
  static from(value: bigint | string | number, decimals?: number): IBigFloat {
    if (typeof value === 'number') {
      return this.fromString(value.toString())
    }
    if (typeof value === 'string') {
      return this.fromString(value)
    }
    if (typeof value === 'bigint' && decimals) {
      return this.fromBigInt(value, decimals)
    }
    throw new BigFloatError(`Invalid Big Float making: ${value.toString()}`)
  }

  static fromBigInt(value: bigint, decimals: number): IBigFloat {
    if (decimals < 0) {
      throw new BigFloatError('decimals must be greater than 0')
    }
    if (decimals > BigFloat.FIXED_DECIMALS) {
      throw new BigFloatError('decimals exceeds maximum allowed value')
    }
    const decimalsDelta = BigFloat.FIXED_DECIMALS - decimals
    const normalizeValue = value * BigInt(10) ** BigInt(decimalsDelta)
    return new BigFloat(normalizeValue)
  }

  static fromString(value: string): IBigFloat {
    const trimmedInput = value.trim()
    const numberRegex = /^-?\d+(\.\d+)?$/
    if (!numberRegex.test(trimmedInput)) {
      throw new BigFloatError(`Invalid input: "${value}" is not a valid number`)
    }
    const [intPart, fracPart = ''] = trimmedInput.split('.')
    const decimals = fracPart.length
    return this.fromBigInt(BigInt(intPart + fracPart), decimals)
  }

  static parseJSON(json: string): IBigFloat {
    const match = BigFloatRegExp.exec(json)
    if (!match) {
      throw new BigFloatError(`Invalid BigFloat JSON format: "${json}"`)
    }
    const numberStr = match[1]
    return BigFloat.fromString(numberStr)
  }

  static isBigFloat(json: string): boolean {
    if (!json.startsWith('BigFloat(')) return false // performance optimization for json parsing
    return BigFloatRegExp.test(json)
  }

  static zero() {
    return new BigFloat(0n)
  }

  static maxUint256() {
    return new BigFloat(2n ** 256n - 1n)
  }

  protected constructor(readonly value: bigint) {}

  toString(): string {
    const factor = BigInt(10) ** BigInt(BigFloat.FIXED_DECIMALS)
    const intPart = this.value / factor
    const fracPart = this.value % factor
    const absFracPart = fracPart < 0n ? -fracPart : fracPart
    const formattedFracPart = absFracPart.toString().padStart(BigFloat.FIXED_DECIMALS, '0')
    return normalizeNumber(
      `${this.value < 0n && intPart >= 0n ? '-' : ''}${intPart}.${formattedFracPart}`
    )
  }

  toJSON() {
    return `BigFloat(${this.toString()})`
  }

  toBigInt(decimals: number): bigint {
    const scaleDelta = decimals - BigFloat.FIXED_DECIMALS
    if (scaleDelta === 0) {
      return this.value
    }

    if (scaleDelta > 0) {
      const factor = BigInt(10) ** BigInt(scaleDelta)
      return this.value * factor
    } else {
      const factor = BigInt(10) ** BigInt(-scaleDelta)
      return this.value / factor
    }
  }

  toFixed(precision: number): string {
    if (precision < 0) {
      throw new BigFloatError('Precision must be a non-negative integer')
    }

    const strValue = this.toString()
    const [intPart, fracPart = ''] = strValue.split('.')
    if (fracPart.length < precision) {
      return `${intPart}.${fracPart.padEnd(precision, '0')}`
    }
    if (precision === 0) {
      return (BigInt(intPart) + (fracPart[0] >= '5' ? 1n : 0n)).toString()
    }
    const roundedFracPart = (
      BigInt(fracPart.slice(0, precision)) + (fracPart[precision] >= '5' ? 1n : 0n)
    ).toString()
    if (roundedFracPart.length > precision) {
      return `${BigInt(intPart) + 1n}.${roundedFracPart.slice(1)}`
    }
    return `${intPart}.${roundedFracPart.padStart(precision, '0')}`
  }

  toFixedSmart(precision: number): string {
    const str = this.toString()
    return smartFormatNumber(str, precision)
  }

  add(other: IBigFloat): IBigFloat {
    return new BigFloat(this.value + other.value)
  }

  sub(other: IBigFloat): IBigFloat {
    return new BigFloat(this.value - other.value)
  }

  mul(other: IBigFloat): IBigFloat {
    const resultValue = (this.value * other.value) / BigInt(10) ** BigInt(BigFloat.FIXED_DECIMALS)
    return new BigFloat(resultValue)
  }

  div(other: IBigFloat): IBigFloat {
    if (other.value === 0n) {
      throw new BigFloatError('Division by zero')
    }
    const scaledValue = this.value * BigInt(10) ** BigInt(BigFloat.FIXED_DECIMALS)
    const resultValue = scaledValue / other.value
    return new BigFloat(resultValue)
  }

  abs(): IBigFloat {
    return new BigFloat(this.value < 0n ? -this.value : this.value)
  }

  equals(other: IBigFloat): boolean {
    return this.value === other.value
  }

  isNegative(): boolean {
    return this.value < 0n
  }

  isZero(): boolean {
    return this.value === 0n
  }
}

function normalizeNumber(input: string): string {
  if (!input.includes('.')) {
    return input.replace(/^0+/, '') || '0'
  }
  const [intPart, fracPart] = input.split('.')
  const normalizedIntPart = intPart.replace(/^0+/, '') || '0'
  const normalizedFracPart = fracPart.replace(/0+$/, '')
  if (normalizedFracPart === '') {
    return normalizedIntPart
  }
  return `${normalizedIntPart}.${normalizedFracPart}`
}

class BigFloatError extends Error {
  constructor(message: string) {
    super(message)
  }
}
