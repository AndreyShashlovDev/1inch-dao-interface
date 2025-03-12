import { IAnimationsManager, IApplicationContext } from '@1inch-community/models'
import { lazy } from '../utils'

export class AnimationsManager implements IAnimationsManager {
  private context?: IApplicationContext

  private readonly setting = lazy(() =>
    this.context!.settings.getSetting('enable-animations', true)
  )

  async init(context: IApplicationContext): Promise<void> {
    this.context = context
  }

  async animate(
    element: HTMLElement,
    keyframes: Keyframe[],
    options?: number | KeyframeAnimationOptions
  ): Promise<void> {
    if (!this.setting.value.value) return
    await element.animate(keyframes, options).finished
  }
}
