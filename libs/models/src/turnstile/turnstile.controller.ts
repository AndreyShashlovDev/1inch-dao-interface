import { InitializingEntity } from '../base'

export interface ITurnstileController extends InitializingEntity {
  getToken(): string | null
  turnstileComplete(): Promise<void>
  getVerificationInProgress(): boolean
  startTurnstile(): void
}
