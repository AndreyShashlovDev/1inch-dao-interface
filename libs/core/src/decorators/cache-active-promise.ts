export function CacheActivePromise<Ctx extends object, T extends Array<unknown>>() {
  const cacheStorage = new WeakMap<object, Map<string, Promise<unknown>>>()

  const getCache = (ctx: Ctx): Map<string, Promise<unknown>> => {
    let cache = cacheStorage.get(ctx)
    if (!cache) {
      cache = new Map<string, Promise<unknown>>()
      cacheStorage.set(ctx, cache)
    }
    return cache
  }

  return function (
    ctx: { constructor: { name: string } },
    fieldName: string,
    propertyDescriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const ctxName = ctx?.constructor?.name ?? ''
    const method: (...args: T) => Promise<unknown> = propertyDescriptor.value
    propertyDescriptor.value = function (...args: T) {
      const cache = getCache(this as Ctx)
      const keyArgs = JSON.stringify(args, stringifyReplacer)
      const key = `${ctxName}.${fieldName}(${keyArgs})`

      if (cache.has(key)) {
        return cache.get(key)
      }

      const result: Promise<unknown> = method.apply(this, args).finally(() => cache.delete(key))
      cache.set(key, result)
      return result
    }

    return propertyDescriptor
  }
}

function stringifyReplacer(_: string, value: unknown) {
  if (typeof value === 'bigint') {
    return value.toString()
  }

  return value
}
