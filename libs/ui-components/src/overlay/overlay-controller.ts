import { getMobileMatchMedia } from '@1inch-community/core/lit-utils'
import { TemplateResult } from 'lit'
import { IOverlayController } from './overlay-controller.interface'
import { OverlayDesktopController } from './overlay-desktop-controller'
import { OverlayMobileController } from './overlay-mobile-controller'

export class OverlayController implements IOverlayController {
  private readonly mobileOverlay: IOverlayController
  private readonly desktopOverlay: IOverlayController

  private readonly mobileMedia = getMobileMatchMedia()

  get isOpen() {
    if (this.mobileMedia.matches) {
      return this.mobileOverlay.isOpen
    }
    return this.desktopOverlay.isOpen
  }

  constructor(rootNodeName: string, target: HTMLElement | 'center') {
    this.mobileOverlay = new OverlayMobileController(rootNodeName)
    this.desktopOverlay = new OverlayDesktopController(target, rootNodeName)
  }

  isOpenOverlay(overlayId: number): boolean {
    if (this.mobileMedia.matches) {
      return this.mobileOverlay.isOpenOverlay(overlayId)
    }
    return this.desktopOverlay.isOpenOverlay(overlayId)
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
}
