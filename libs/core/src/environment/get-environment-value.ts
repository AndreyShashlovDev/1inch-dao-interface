import { IEnvironment } from '@1inch-community/models'

export interface Environment extends IEnvironment {}

const requiredEnvFields: (keyof Environment)[] = ['oneInchDevPortalHost', 'walletConnectProjectId']

const __environment__: Environment = {
  oneInchDevPortalHost: '',
  walletConnectProjectId: '',
}

const env: Partial<Environment> = {
  oneInchDevPortalHost: 'https://api.1inch.dev',
}

let embeddedMode = false

/**
 * @deprecated
 * */
export function getEnvironmentValue<K extends keyof Environment>(valueName: K): Environment[K] {
  if (embeddedMode && env[valueName] === undefined && requiredEnvFields.includes(valueName)) {
    throw new Error(`environment value ${valueName} not exist`)
  }
  if (embeddedMode) {
    return env[valueName]!
  }
  return __environment__[valueName] ?? env[valueName]!
}

export function setEnvironmentValue<K extends keyof Environment>(
  valueName: K,
  value: Environment[K]
) {
  env[valueName] = value
}

export function enabledEmbeddedMode() {
  embeddedMode = true
}
