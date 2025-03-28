import { getMobileMatchMedia } from '@1inch-community/core/lit-utils'
import { TemplateResult } from 'lit'
import { IOverlayController } from './overlay-controller.interface'
import { OverlayDesktopController } from './overlay-desktop-controller'
import { OverlayMobileController } from './overlay-mobile-controller'
import { OverlayPopupController } from './overlay-popup-controller';

export class OverlayController implements IOverlayController {
  private readonly mobileOverlay: IOverlayController
  private readonly desktopOverlay: IOverlayController
  private readonly popupOverlay: IOverlayController

  private readonly mobileMedia = getMobileMatchMedia()

  get isOpen() {
    if (this.mobileMedia.matches) {
      return this.mobileOverlay.isOpen
    }
    return this.desktopOverlay.isOpen
  }

  constructor(rootNodeName: string, targetFactory: () => HTMLElement | null) {
    this.mobileOverlay = new OverlayMobileController(rootNodeName)
    this.desktopOverlay = new OverlayDesktopController(targetFactory, rootNodeName)
    this.popupOverlay = new OverlayPopupController(targetFactory, rootNodeName)
  }

  isOpenOverlay(overlayId: number): boolean {
    if (this.mobileMedia.matches) {
      return this.mobileOverlay.isOpenOverlay(overlayId)
    }
    return this.desktopOverlay.isOpenOverlay(overlayId)
  }

  isPopupOpen(overlayId: number): boolean {
    return this.popupOverlay.isOpenOverlay(overlayId)
  }

  async open(openTarget: TemplateResult | HTMLElement): Promise<number> {
    if (this.mobileMedia.matches) {
      return await this.mobileOverlay.open(openTarget)
    }
    return await this.desktopOverlay.open(openTarget)
  }

  async close(overlayId: number): Promise<void> {
    if (this.mobileMedia.matches) {
      return await this.mobileOverlay.close(overlayId)
    }
    return await this.desktopOverlay.close(overlayId)
  }

  async openPopup(openTarget: TemplateResult | HTMLElement): Promise<number> {
    return await this.popupOverlay.open(openTarget)
  }

  async closePopup(overlayId: number): Promise<void> {
    return await this.popupOverlay.close(overlayId)
  }
}
