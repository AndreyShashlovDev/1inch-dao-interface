import { getMobileMatchMedia } from '@1inch-community/core/lit-utils'
import { IOverlayController, OverlayViewConfig, OverlayViewMode } from '@1inch-community/models'
import { TemplateResult } from 'lit'
import { OverlayDesktopController } from './overlay-desktop-controller'
import { OverlayMobileController } from './overlay-mobile-controller'
import { OverlayPopupController } from './overlay-popup-controller'
import { viewConfigDefault } from './overlay-view-config-default'

export class OverlayController implements IOverlayController {
  private readonly mobileOverlay: IOverlayController
  private readonly desktopOverlay: IOverlayController
  private readonly popupOverlay: IOverlayController

  private readonly mobileMedia = getMobileMatchMedia()

  constructor(rootNodeName: string) {
    this.mobileOverlay = new OverlayMobileController(rootNodeName)
    this.desktopOverlay = new OverlayDesktopController(rootNodeName)
    this.popupOverlay = new OverlayPopupController(rootNodeName)
  }

  async init(): Promise<void> {}

  isOpenOverlay(overlayId: number | null | undefined): overlayId is number {
    if (typeof overlayId !== 'number') return false
    const isOpenDesktopOverlay = this.desktopOverlay.isOpenOverlay(overlayId)
    const isOpenMobileOverlay = this.mobileOverlay.isOpenOverlay(overlayId)
    const isOpenPopupOverlay = this.popupOverlay.isOpenOverlay(overlayId)
    return isOpenDesktopOverlay || isOpenMobileOverlay || isOpenPopupOverlay
  }

  async open(
    openTarget: TemplateResult | HTMLElement,
    viewConfig: OverlayViewConfig = viewConfigDefault
  ): Promise<number> {
    const internalViewConfig = { ...viewConfigDefault, ...viewConfig }
    const [overlay, mode] = this.resolveControllerByMode(internalViewConfig.mode!)

    return await overlay.open(openTarget, { ...viewConfig, mode })
  }

  async close(overlayId: number): Promise<void> {
    if (this.desktopOverlay.isOpenOverlay(overlayId)) {
      return await this.desktopOverlay.close(overlayId)
    }
    if (this.mobileOverlay.isOpenOverlay(overlayId)) {
      return await this.mobileOverlay.close(overlayId)
    }
    if (this.popupOverlay.isOpenOverlay(overlayId)) {
      return await this.popupOverlay.close(overlayId)
    }
  }

  private resolveControllerByMode(mode: OverlayViewMode) {
    let resolvedMode = mode
    if (mode === OverlayViewMode.auto) {
      resolvedMode = this.mobileMedia.matches ? OverlayViewMode.mobile : OverlayViewMode.desktop
    }
    if (mode === OverlayViewMode.popupAuto) {
      resolvedMode = this.mobileMedia.matches ? OverlayViewMode.mobile : OverlayViewMode.popup
    }
    let overlay: IOverlayController
    switch (resolvedMode) {
      case OverlayViewMode.desktop:
        overlay = this.desktopOverlay
        break
      case OverlayViewMode.mobile:
        overlay = this.mobileOverlay
        break
      case OverlayViewMode.popup:
        overlay = this.popupOverlay
        break
      default:
        throw new Error(`Unsupported overlay mode: ${resolvedMode}`)
    }
    return [overlay, resolvedMode] as const
  }
}
