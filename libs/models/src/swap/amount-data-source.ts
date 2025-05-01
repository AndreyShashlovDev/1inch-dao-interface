export interface IAmountDataSource {
  getMaxAmount(): Promise<bigint>
}
