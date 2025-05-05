type ScheduleMethod = (...args: unknown[]) => void
type Accumulator<T extends unknown[]> = (accumulator: T | null, currentValue: T) => T

export function Schedule<Ctx extends object, Method extends ScheduleMethod>(
  debounceTime: number,
  accumulator: Accumulator<Parameters<Method>>
) {
  return function (
    ctx: { constructor: { name: string } },
    fieldName: string,
    propertyDescriptor: TypedPropertyDescriptor<Method>
  ) {
    const method: Method | undefined = propertyDescriptor.value
    let accumulatorArgs: Parameters<Method> | null = null
    let timer: ReturnType<typeof setTimeout> | null = null

    if (method === undefined) {
      throw new Error(`Method ${fieldName} is undefined.`)
    }

    if (typeof method !== 'function') {
      throw new Error(`${fieldName} is not a function`)
    }

    propertyDescriptor.value = function (this: Ctx, ...args: Parameters<Method>): void {
      accumulatorArgs = accumulator(accumulatorArgs, args)
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        method.apply(this, accumulatorArgs!)
        accumulatorArgs = null
        timer = null
      }, debounceTime)
    } as Method
  }
}
