export interface IBigFloat {
  readonly value: bigint
  isZero(): boolean
  isNegative(): boolean
  equals(other: IBigFloat): boolean
  abs(): IBigFloat
  div(other: IBigFloat): IBigFloat
  mul(other: IBigFloat): IBigFloat
  sub(other: IBigFloat): IBigFloat
  add(other: IBigFloat): IBigFloat
  toFixed(precision: number): string
  toFixedSmart(precision: number): string
  toBigInt(decimals: number): bigint
  toJSON(): string
  toString(): string
}
