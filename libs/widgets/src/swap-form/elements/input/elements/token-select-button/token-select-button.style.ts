import { css } from 'lit'

export const tokenSelectButtonStyle = css`
  :host {
    width: fit-content;
    color: var(--color-content-content-primary);
  }

  .select-token-button {
    border: none;
    background-color: transparent;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    color: var(--color-content-content-primary);
    border-radius: 16px;
    padding: 8px;
    margin-left: -8px;
    transition: background-color 0.2s;
    outline: none;
    user-select: none;
    width: fit-content;
    font-size: 24px;
    font-weight: 600;
    line-height: 32px;
    letter-spacing: 0;
    text-align: left;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    -webkit-tap-highlight-color: transparent;
  }

  .select-token-text {
    white-space: nowrap;
  }

  @media (hover: hover) {
    .select-token-button:hover {
      background-color: var(--color-background-bg-positive-hover);
    }
  }
`
