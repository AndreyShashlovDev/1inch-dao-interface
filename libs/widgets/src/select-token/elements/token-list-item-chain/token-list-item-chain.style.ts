import { css } from 'lit'

export const tokenListItemChainStyle = css`
  :host {
    display: flex;
    align-content: center;
    justify-content: space-between;
    padding: 12px 16px;
    box-sizing: border-box;
    height: 60px;
    color: var(--color-content-content-primary);
    cursor: pointer;
    border-radius: 16px;
    transition: background-color 0.2s;
  }

  .left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .balance {
    color: var(--color-content-content-primary);
    font-size: 16px;
    font-style: normal;
    font-weight: 500;
    line-height: 24px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .fiat-balance {
    color: var(--color-content-content-secondary);
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 20px;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }

  @media (hover: hover) {
    :host(:hover) {
      background-color: var(--color-background-bg-active);
    }
  }
`
