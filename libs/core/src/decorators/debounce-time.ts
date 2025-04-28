export function debounceTime(ms: number) {
  return function (_: unknown, __: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    let timer: ReturnType<typeof setTimeout> | null = null

    descriptor.value = function (...args: unknown[]) {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        originalMethod.apply(this, args)
      }, ms)
    }

    return descriptor
  }
}
