import { css } from 'lit'

export const favoriteTokenToggleStyle = css`
  .right {
    transition: transform 0.2s;
  }

  .favorite-icon {
    transition: transform 0.2s;
  }

  @media (hover: hover) {
    :host(:not(.favorite-token)) .favorite-icon {
      transform: translateX(200%);
    }

    :host(:not(.favorite-token)) .favorite-icon:dir(rtl) {
      transform: translateX(-200%);
    }

    :host(.show-favorite-token-toggle:not(.favorite-token)) .right {
      transform: translateX(16px);
    }

    :host(.show-favorite-token-toggle:not(.favorite-token)) .right:dir(rtl) {
      transform: translateX(-16px);
    }

    :host(:not(.favorite-token):hover) .favorite-icon {
      transform: translateX(0);
    }

    :host(:not(.favorite-token):hover) .right,
    :host(:not(.favorite-token):hover) .right:dir(rtl) {
      transform: translateX(0);
    }

    :host(:hover) .favorite-icon:hover {
      transform: translateX(0) scale(1.1);
    }
  }
`
