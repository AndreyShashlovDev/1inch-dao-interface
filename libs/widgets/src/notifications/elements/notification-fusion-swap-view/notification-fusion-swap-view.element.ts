import { smartFormatNumber } from '@1inch-community/core/formatters'
import { lazyAppContextConsumer } from '@1inch-community/core/lazy'
import { subscribe, translate } from '@1inch-community/core/lit-utils'
import { ChainId, IToken, OrderStatus, OrderStatusResult } from '@1inch-community/models'
import { Task, TaskStatus } from '@lit/task'
import { html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { when } from 'lit/directives/when.js'
import { tap } from 'rxjs'
import { Address, formatUnits, Hash } from 'viem'
import { notificationFusionSwapViewStyles } from './notification-fusion-swap-view.styles'

import('../../../shared-elements/token-icon')
import('@1inch-community/ui-components/timer')
import('@1inch-community/ui-components/button')

type TaskResult = [OrderStatusResult | null, IToken | null, IToken | null]

@customElement(NotificationFusionSwapViewElement.tagName)
export class NotificationFusionSwapViewElement extends LitElement {
  static readonly tagName = 'inch-notification-fusion-swap-view' as const

  static override styles = notificationFusionSwapViewStyles

  @property({ type: String }) orderHash?: Hash

  private readonly applicationContext = lazyAppContextConsumer(this)

  @state() private cancelInProgress = false

  private chainId?: ChainId

  private readonly task = new Task(
    this,
    async ([orderHash]): Promise<TaskResult> => {
      const chainId = this.chainId ?? (await this.applicationContext.value.wallet.data.getChainId())
      if (!chainId || !orderHash) throw new Error('')
      if (!this.chainId) {
        this.startUpdate(chainId)
      }
      this.chainId = chainId
      const status = await this.applicationContext.value.api.getOrderStatus(orderHash)
      if (status === null) {
        return [null, null, null]
      }
      if ('statusCode' in status) {
        throw status
      }
      if (this.task.value !== undefined) {
        const sourceToken: IToken | null = this.task.value[1]
        const destinationToken: IToken | null = this.task.value[2]
        return [status, sourceToken, destinationToken] as const
      }
      const [sourceToken, destinationToken] = await Promise.all([
        this.applicationContext.value.tokenStorage.getToken(
          chainId,
          status.fromTokenAddress as Address
        ),
        this.applicationContext.value.tokenStorage.getToken(
          chainId,
          status.toTokenAddress as Address
        ),
      ])
      return [status, sourceToken, destinationToken] as const
    },
    () => [this.orderHash] as const
  )

  connectedCallback() {
    super.connectedCallback()
    if (this.chainId) {
      this.startUpdate(this.chainId)
    }
  }

  protected render() {
    return this.task.render({
      complete: ([status, sourceToken, destinationToken]) =>
        this.onCompleteView(status, sourceToken, destinationToken),
      pending: () => this.onPendingView(),
      error: (error: unknown) => this.onErrorView(error),
    })
  }

  private onCompleteView(
    status: OrderStatusResult | null,
    sourceToken: IToken | null,
    destinationToken: IToken | null
  ) {
    const chainId = this.chainId
    if (!status || !sourceToken || !destinationToken || !chainId) return html``
    const sourceTokenAmount = BigInt(status.makingAmount)
    const destinationTokenAmount = BigInt(status.takingAmount)
    return html`
      <div class="status-view-container">
        <div class="token-icon-container">
          <inch-token-icon
            class="source-token-icon"
            symbol="${ifDefined(sourceToken?.symbol)}"
            address="${ifDefined(sourceToken?.address)}"
            .chainId="${chainId}"
          ></inch-token-icon>
          <inch-token-icon
            class="destination-token-icon"
            symbol="${ifDefined(destinationToken?.symbol)}"
            address="${ifDefined(destinationToken?.address)}"
            .chainId="${chainId}"
          ></inch-token-icon>
        </div>
        <div class="swap-info-container">
          <div class="amount-status-view">
            ${smartFormatNumber(formatUnits(sourceTokenAmount, sourceToken.decimals), 2)}
            <span class="symbol-view">${sourceToken?.symbol}</span>
            →
            ${smartFormatNumber(formatUnits(destinationTokenAmount, destinationToken.decimals), 2)}
            <span class="symbol-view">${destinationToken?.symbol}</span>
          </div>
          <div class="swap-status-view">${this.getStatusView(status)}</div>
        </div>
      </div>
    `
  }

  private onPendingView() {
    if (this.task.value) return this.onCompleteView(...this.task.value)
    return html`
      <div class="loading-view">
        <div class="loader"></div>
        <div>Update order status</div>
      </div>
    `
  }

  private onErrorView(error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      typeof error.statusCode === 'number' &&
      error.statusCode >= 400 &&
      error.statusCode < 500
    ) {
      return html`
        <div class="error-view">
          <div>Swap not found</div>
        </div>
      `
    }
    return html`
      <div class="error-view">
        <div>Error load swap status</div>
      </div>
    `
  }

  private getStatusView(status: OrderStatusResult) {
    const statusText: string = status.status
    const classes = {
      'status-view': true,
      ['status-view__' + statusText]: true,
    }
    const expirationTime = (status.auctionStartDate + status.auctionDuration) * 1000
    return html`
      <div class="status-container">
        <div class="${classMap(classes)}">
          ${translate(`widgets.notifications.fusion-swap-view.status.${statusText}`)}
        </div>
        ${when(
          statusText === OrderStatus.Pending,
          () => html`
            <span><inch-timer expirationTime="${expirationTime}"></inch-timer></span>
            <inch-button
              class="cancel-button"
              size="s"
              type="secondary-critical"
              loader="${ifDefined(this.cancelInProgress ? '' : undefined)}"
              @click="${async () => {
                this.cancelInProgress = true
                await this.applicationContext.value.api
                  .cancelOrder(this.orderHash!)
                  .catch(() => null)
                await this.task.run([this.orderHash])
              }}"
              >${translate('widgets.notifications.fusion-swap-view.control.cancel')}</inch-button
            >
          `
        )}
      </div>
    `
  }

  private startUpdate(chainId: ChainId) {
    subscribe(
      this,
      [
        this.applicationContext.value.onChain.getBlockEmitter(chainId).pipe(
          tap(() => {
            if (this.task.status !== TaskStatus.COMPLETE || !this.task.value) return
            const status = this.task.value[0]
            if (status === null) return
            if (status.status !== OrderStatus.Pending) return
            this.task.run([this.orderHash]).catch(console.error)
          })
        ),
      ],
      { requestUpdate: false }
    )
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inch-notification-fusion-swap-view': NotificationFusionSwapViewElement
  }
}
