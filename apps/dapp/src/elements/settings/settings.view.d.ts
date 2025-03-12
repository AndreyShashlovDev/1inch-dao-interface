import { IApplicationContext } from '@1inch-community/models'
import '@1inch-community/ui-components/card'
import '@1inch-community/ui-components/icon'
import { SceneController } from '@1inch-community/ui-components/scene'
import '@1inch-community/ui-components/segmented-control'
import { LitElement } from 'lit'
export declare function getMainSettingsView(
  scene: SceneController<string, string>,
  element: LitElement
): import('lit').TemplateResult<1>
export declare function getPersonalizationSettingsView(
  scene: SceneController<string, string>,
  applicationContext: IApplicationContext,
  element: LitElement
): import('lit').TemplateResult<1>
export declare function getLocalizationSettingsView(
  scene: SceneController<string, string>,
  applicationContext: IApplicationContext
): import('lit').TemplateResult<1>
