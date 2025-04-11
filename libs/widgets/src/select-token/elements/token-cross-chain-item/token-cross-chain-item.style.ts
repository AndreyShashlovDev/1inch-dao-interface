import { mobileMediaCSS } from '@1inch-community/core/lit-utils'
import { css } from 'lit'

export const tokenCrossChainItemStyle = css`
  :host {
    margin-top: 2px;
    display: flex;
    flex-direction: column;
    height: 72px;
    width: 100%;
    outline: none;
    user-select: none;
    padding: 12px 16px;
    border-radius: 16px;
    overflow: hidden;
    transition:
      background-color 0.2s,
      height 0.2s;
    -webkit-tap-highlight-color: transparent;
  }

  :host(.expanded) {
    background-color: var(--color-background-bg-secondary);
  }

  .item-container {
    width: 100%;
    display: flex;
    gap: 8px;
    align-items: center;
    cursor: pointer;
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
    transition:
      transform 0.2s,
      opacity 0.2s;
  }

  .right-content__expanded {
    transform: translate3d(0, 15%, 0);
    opacity: 0;
  }

  .chain-view {
    padding-top: 8px;
    transition:
      opacity 0.2s,
      transform 0.2s;
  }

  .chain-view__hide {
    pointer-events: none;
    opacity: 0;
    transform: translateY(-10%);
  }

  .full-chain-view-button {
    color: var(--primary);
    height: 48px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    margin-left: 8px;
    transition: color 0.2s;
  }

  .more-icon-container {
    position: relative;
    width: 24px;
    height: 24px;
  }

  .more-icon {
    position: absolute;
    transition:
      opacity 0.2s,
      transform 0.2s;
  }

  .more-icon__hide {
    transform: rotate(90deg);
    opacity: 0;
  }

  @media (hover: hover) {
    :host(:hover:not(.expanded)) {
      background-color: var(--color-background-bg-secondary);
    }

    .full-chain-view-button:hover {
      color: var(--primary-hover);
    }
  }

  ${mobileMediaCSS(css`
    :host {
      padding: 8px 8px;
    }
  `)}

  :host(:active) {
    background-color: var(--color-background-bg-secondary);
  }
`
