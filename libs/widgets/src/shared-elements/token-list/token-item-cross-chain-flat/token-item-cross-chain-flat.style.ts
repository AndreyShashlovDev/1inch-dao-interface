import { css } from 'lit'

export const tokenItemCrossChainFlatStyle = css`
  :host {
    display: flex;
    align-items: center;
    margin-top: 2px;
    gap: 8px;
    height: 72px;
    width: 100%;
    padding: 12px 16px;
    color: var(--color-content-content-primary);
    cursor: pointer;
    border-radius: 16px;
    transition: background-color 0.2s;
  }

  .left {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .right {
    display: flex;
    flex-direction: column;
    align-items: end;
    gap: 4px;
    margin-left: auto;
  }

  .text {
    font-weight: 500;
    font-size: 16px;
    line-height: 24px;
    letter-spacing: 0;
    vertical-align: middle;
  }

  .description {
    color: var(--color-content-content-secondary);
  }

  .right:dir(rtl) {
    margin-right: auto;
    margin-left: 0;
  }

  @media (hover: hover) {
    :host(:hover) {
      background-color: var(--color-background-bg-secondary);
    }
  }
`
