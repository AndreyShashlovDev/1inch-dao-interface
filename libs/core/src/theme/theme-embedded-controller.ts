import {
  AccentColors,
  IApplicationContext,
  IThemeManager,
  MainColors,
} from '@1inch-community/models'

export class ThemeEmbeddedManager implements IThemeManager {
  async init(context: IApplicationContext): Promise<void> {
    //
  }

  async onChangeTheme(
    mainColorName: MainColors,
    brandColorName: AccentColors,
    event?: MouseEvent
  ): Promise<void> {
    throw new Error('ThemeEmbeddedManager not support onChangeTheme')
  }

  async onChangeMainColor(mainColorName: MainColors, event?: MouseEvent): Promise<void> {
    throw new Error('ThemeEmbeddedManager not support onChangeMainColor')
  }

  async onChangeBrandColor(brandColorName: AccentColors, event?: MouseEvent): Promise<void> {
    throw new Error('ThemeEmbeddedManager not support onChangeBrandColor')
  }

  getActiveBrandColor(): AccentColors {
    throw new Error('ThemeEmbeddedManager not support getActiveBrandColor')
  }

  getActiveMainColor(): MainColors {
    throw new Error('ThemeEmbeddedManager not support getActiveMainColor')
  }
}
