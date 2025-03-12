import { CacheActivePromise } from '@1inch-community/core/decorators'
import { appendStyle, vibrate } from '@1inch-community/core/lit-utils'
import {
  animationFrameScheduler,
  defer,
  filter,
  firstValueFrom,
  fromEvent,
  map,
  subscribeOn,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs'
import { __decorate, __metadata } from 'tslib'
export function unicornTouchUpdate(context, swapFormContainerRef, unicornLoaderRef) {
  let lastPosition = 0
  let full = false
  let resetInProgress = false
  const audio = new AudionController()
  const max = 60
  const initialResistance = 500000
  const resistanceThreshold = 3
  const resistance = 4
  const root = () => document.querySelector('#app-root')
  const target = () => swapFormContainerRef.value
  const loader = () => unicornLoaderRef.value
  const set = (position) => {
    if (position < 0) return
    let adjustedPosition
    if (position > max) {
      if (!full) {
        vibrate(50)
        audio.play().then()
      }
      full = true
      if (position <= max + resistanceThreshold) {
        adjustedPosition = max + (position - max) / initialResistance
      } else {
        adjustedPosition =
          max +
          resistanceThreshold / initialResistance +
          (position - max - resistanceThreshold) / resistance
      }
    } else {
      full = false
      adjustedPosition = position
    }
    const loaderPosition = (position > max ? max : position) / max
    appendStyle(loader(), { transform: `scale(${loaderPosition})` })
    appendStyle(target(), { transform: `translate3d(0, ${adjustedPosition}px, 0)` })
    lastPosition = adjustedPosition
  }
  const reset = async () => {
    resetInProgress = true
    let _lastPosition = lastPosition
    if (_lastPosition > max && audio.isPlaying) {
      await context.animations.animate(
        target(),
        [
          { transform: `translate3d(0, ${_lastPosition}px, 0)` },
          { transform: `translate3d(0, ${max}px, 0)` },
        ],
        {
          duration: 200,
          easing: 'cubic-bezier(.2, .8, .2, 1)',
        }
      )
      _lastPosition = max
      appendStyle(target(), { transform: `translate3d(0, ${_lastPosition}px, 0)` })
      await audio.onEnded()
    }
    await context.animations.animate(
      target(),
      [
        { transform: `translate3d(0, ${_lastPosition}px, 0)` },
        { transform: `translate3d(0, 0, 0)` },
      ],
      {
        duration: 800,
        easing: 'cubic-bezier(.2, .8, .2, 1)',
      }
    )
    set(0)
    appendStyle(target(), { transform: '' })
    full = false
    resetInProgress = false
  }
  return defer(() => {
    const targetEl = target()
    return fromEvent(targetEl, 'touchstart').pipe(
      filter(() => {
        return !resetInProgress && (root()?.scrollTop ?? 0) === 0
      }),
      switchMap((startEvent) => {
        audio.load()
        const startPoint = startEvent.touches[0].clientY
        return fromEvent(targetEl, 'touchmove').pipe(
          map((event) => event.touches[0].clientY - startPoint),
          tap((position) => set(position)),
          takeUntil(fromEvent(targetEl, 'touchend').pipe(tap(() => reset())))
        )
      })
    )
  }).pipe(subscribeOn(animationFrameScheduler))
}
class AudionController {
  get isPlaying() {
    return !this.audio.paused
  }
  constructor() {
    this.audio = new Audio('audio/unicorn-run.mp3')
    this.audio.preload = 'none'
    this.audio.volume = 0.4
  }
  load() {
    this.audio.load()
  }
  async play() {
    try {
      await this.audio.play()
    } catch (e) {
      console.error('AudionController Error', e)
    }
  }
  onEnded() {
    return firstValueFrom(fromEvent(this.audio, 'ended'))
  }
}
__decorate(
  [
    CacheActivePromise(),
    __metadata('design:type', Function),
    __metadata('design:paramtypes', []),
    __metadata('design:returntype', Promise),
  ],
  AudionController.prototype,
  'play',
  null
)
//# sourceMappingURL=unicorn-updater.js.map
