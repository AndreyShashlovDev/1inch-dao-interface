import { IApplicationContext, ITheme } from '@1inch-community/models'
import type { CSSResult } from 'lit'

export class Theme implements ITheme {
  constructor(protected readonly colorScheme: CSSResult) {}

  async init(context: IApplicationContext): Promise<void> {}

  applyStyle(element: HTMLStyleElement): void {}

  destroy(): void {}
}
