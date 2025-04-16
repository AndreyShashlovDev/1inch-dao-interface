import { css } from 'lit'

export const tokenIconStyle = css`
  :host {
    user-select: none;
    outline: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .stub {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-background-bg-secondary);
    border-radius: 50%;
    color: var(--color-content-content-secondary);
    position: relative;
  }

  .stub-loader {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 1px solid;
    border-bottom-color: var(--secondary);
    border-top-color: var(--secondary);
    animation: spin 1s linear infinite;
  }

  img {
    user-select: none;
    outline: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .wrap-chain {
    position: relative;
  }

  .chain-view {
    position: absolute;
    bottom: 0;
    right: 0;
    border: 2px solid var(--color-background-bg-primary);
    border-radius: 50%;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }
`
