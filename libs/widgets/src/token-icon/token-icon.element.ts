import { ApplicationContextToken } from '@1inch-community/core/application-context'
import { ChainId, IApplicationContext, IToken } from '@1inch-community/models'
import { chainViewConfig, getWrapperNativeToken, isNativeToken } from '@1inch-community/sdk/chain'
import '@1inch-community/ui-components/icon'
import { consume } from '@lit/context'
import { Task } from '@lit/task'
import { html, LitElement, TemplateResult } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import type { Address } from 'viem'
import { repositories } from './repositories'
import { RepositoryPayload } from './repositories/repository.model'
import { tokenIconStyle } from './token-icon.style'

@customElement(TokenIconElement.tagName)
export class TokenIconElement extends LitElement {
  static tagName = 'inch-token-icon' as const

  static override styles = [tokenIconStyle]

  @property({ type: String, attribute: true }) symbol?: string
  @property({ type: String, attribute: true }) address?: Address
  @property({ type: Number, attribute: true }) chainId?: ChainId
  @property({ type: Number, attribute: true }) size = 24
  @property({ type: Boolean, attribute: true }) hideChainIcon = false

  @consume({ context: ApplicationContextToken })
  applicationContext!: IApplicationContext

  private readonly task = new Task(this, {
    task: ([symbol, address, chainId], { signal }) => {
      return this.iconLoader(signal, chainId, symbol, address)
    },
    args: () =>
      [this.symbol, this.address, this.chainId] as [
        string | undefined,
        Address | undefined,
        number | undefined,
      ],
  })

  protected override render() {
    return this.task.render({
      error: () => symbolView(this.size, this.symbol),
      pending: () => symbolView(this.size, this.symbol, true),
      initial: () => symbolView(this.size, this.symbol, true),
      complete: (value) => {
        value.width = this.size
        value.height = this.size
        value.ondragstart = () => false
        return appendChainIcon(html`${value}`, this.hideChainIcon, this.size, this.chainId)
      },
    })
  }

  protected override updated() {
    this.style.width = `${this.size}px`
    this.style.height = `${this.size}px`
  }

  private async iconLoader(
    signal: AbortSignal,
    chainId?: ChainId,
    symbol?: string,
    address?: Address
  ): Promise<HTMLImageElement> {
    let result = await this.loadFromDatabase({ chainId, symbol, address, signal })
    if (result === null) {
      result = await loadFromRepository({ chainId, symbol, address, signal })
    }
    if (result === null) {
      result = await this.loadIconFromMultiChain({ chainId, symbol, address, signal })
    }
    if (result === null) {
      throw new Error('token icon not fount')
    }
    return result
  }

  private async loadFromDatabase(data: RepositoryPayload): Promise<HTMLImageElement | null> {
    if (!data.chainId || !data.address) {
      return null
    }
    const logoURL = await this.applicationContext.tokenStorage.getTokenLogoURL(
      data.chainId,
      data.address
    )
    if (!logoURL) {
      return null
    }
    return await new Promise((resolve) => {
      const img = new Image()
      img.onerror = () => resolve(null)
      img.onload = () => resolve(img)
      img.src = logoURL
    })
  }

  private async loadIconFromMultiChain(data: RepositoryPayload): Promise<HTMLImageElement | null> {
    if (data.chainId === ChainId.eth || !data.symbol) return null
    const tokens: IToken[] = await this.applicationContext.tokenStorage.getTokenBySymbol(
      ChainId.eth,
      data.symbol
    )
    if (data.chainId && data.address && isNativeToken(data.address)) {
      const wrapToken = getWrapperNativeToken(data.chainId)
      tokens.push(wrapToken)
    }
    for (const token of tokens) {
      const result = await loadFromRepository({
        ...data,
        chainId: token.chainId,
        address: token.address,
      })
      if (result) return result
    }
    return null
  }
}

function appendChainIcon(
  view: TemplateResult,
  hideChainIcon: boolean,
  size: number,
  chainId?: ChainId
) {
  if (!chainId || hideChainIcon) return view
  const chainSize = size / 2.5
  return html`
    <div class="wrap-chain">
      ${view}
      <inch-icon
        class="chain-view"
        width="${chainSize}"
        height="${chainSize}"
        icon="${chainViewConfig[chainId].iconName}"
      ></inch-icon>
    </div>
  `
}

function symbolView(size: number, symbol?: string, showLoader?: boolean) {
  return html`
    <div
      style="width: ${size}px; height: ${size}px; font-size: ${size < 40 ? 13 : 16}px"
      class="stub"
    >
      <span>${symbol?.slice(0, size < 40 ? 1 : 2) ?? ''}</span>
      ${showLoader ? html`<span class="stub-loader"></span>` : ''}
    </div>
  `
}

async function loadFromRepository(
  data: RepositoryPayload,
  index = 0
): Promise<HTMLImageElement | null> {
  const repositoryLoader = repositories[index]
  if (!repositoryLoader) return null
  try {
    const repository = await repositoryLoader()
    return await repository(data)
  } catch {
    return await loadFromRepository(data, index + 1)
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inch-token-icon': TokenIconElement
  }
}
