import { mobileMediaCSS } from '@1inch-community/core/lit-utils'
import { css } from 'lit'

export const tokenListItemStyle = css`
  :host {
    height: 72px;
    width: 100%;
    outline: none;
    user-select: none;
    transition: height 0.2s;
    -webkit-tap-highlight-color: transparent;
  }

  .item-container {
    padding: 12px 16px;
    display: flex;
    gap: 8px;
    align-items: center;
    cursor: pointer;
    border-radius: 16px;
    transition: background-color 0.2s;
  }

  .item-container__expanded {
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 50%;
  }

  .content .primary-content {
    color: var(--color-content-content-primary);
    font-size: 16px;
    font-style: normal;
    font-weight: 500;
    line-height: 24px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .content .secondary-content {
    color: var(--color-content-content-secondary);
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 20px;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }

  .right-content {
    margin-left: auto;
    align-items: flex-end;
  }

  @media (hover: hover) {
    .item-container:hover {
      background-color: var(--color-background-bg-secondary);
    }
  }

  ${mobileMediaCSS(css`
    .item-container {
      padding: 8px 8px;
    }
  `)}

  .item-container:active {
    background-color: var(--color-background-bg-secondary);
  }
`
