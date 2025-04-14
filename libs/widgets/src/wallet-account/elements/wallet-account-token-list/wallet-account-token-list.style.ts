import { mobileMediaCSS } from '@1inch-community/core/lit-utils'
import { css } from 'lit'

export const walletAccountTokenListStyle = css`
  :host {
    height: 50vh;
    width: 100%;
    //position: relative;
  }

  .overlay-message {
    position: absolute;
    top: 35%;
    left: 0;
    width: 100%;
    text-align: center;
    color: var(--color-content-content-primary);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .list-header {
    color: var(--color-content-content-secondary);
  }

  ${mobileMediaCSS(css`
    :host {
      height: 100%;
      width: 100%;
    }
  `)}
`
