import { subscribe } from '@1inch-community/core/lit-utils'
import { ISelectTokenContext } from '@1inch-community/models'
import '@1inch-community/ui-components/icon'
import { ISceneContext, sceneContext } from '@1inch-community/ui-components/scene'
import { consume } from '@lit/context'
import { html, LitElement } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { when } from 'lit/directives/when.js'
import { of, tap } from 'rxjs'
import { selectTokenContext } from '../../context'
import { searchTokenInputStyle } from './search-token-input.style'

@customElement(SearchTokenInputElement.tagName)
export class SearchTokenInputElement extends LitElement {
  static tagName = 'inch-search-token-input' as const

  static override styles = searchTokenInputStyle

  @state() private isFocused = false
  @state() private searchInProgress = false

  @consume({ context: sceneContext })
  sceneContext?: ISceneContext

  @consume({ context: selectTokenContext })
  context?: ISelectTokenContext

  protected override render() {
    const classes = {
      'search-token-input-container': true,
      'search-token-input-container__focused': this.isFocused,
    }
    return html`
      <div class="${classMap(classes)}">
        <inch-icon icon="search24"></inch-icon>
        <input
          id="search"
          autofocus
          autocomplete="off"
          maxlength="40"
          @input="${(event: InputEvent) => this.onChange(event)}"
          @focus="${() => (this.isFocused = true)}"
          @blur="${() => (this.isFocused = false)}"
          placeholder="Search token by name or address"
          class="search-token-input"
        />
        ${when(
          this.searchInProgress,
          () => html`<span class="loader"></span>`,
          () => html``
        )}
      </div>
    `
  }

  protected override async firstUpdated() {
    subscribe(
      this,
      [
        this.context?.searchInProgress$.pipe(tap((state) => (this.searchInProgress = state))) ??
          of(),
      ],
      { requestUpdate: false }
    )
  }

  private onChange(event: InputEvent) {
    const value = (event.target as HTMLInputElement).value
    this.context?.setSearchToken(value)
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inch-search-token-input': SearchTokenInputElement
  }
}
