import { css } from 'lit'

export const tokenItemCrossChainAccordionStyle = css`
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
    color: var(--color-content-content-primary);
    transition:
      background-color 0.2s,
      height 0.2s;
    -webkit-tap-highlight-color: transparent;
  }

  :host(.expanded) {
    background-color: var(--color-background-bg-secondary);
  }

  .chevron {
    transform: rotate(-90deg);
    transition: transform 0.2s;
  }

  .chevron:dir(rtl) {
    transform: rotate(90deg);
  }

  :host(.expanded) .chevron {
    transform: rotate(0);
  }

  .chain-list-view {
    display: flex;
    flex-direction: column;
    opacity: 0;
    position: relative;
    transition: opacity 0.2s;
  }

  :host(.expanded) .chain-list-view {
    opacity: 1;
  }

  .cross-chain-token-container {
    display: flex;
    cursor: pointer;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
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
    transition:
      transform 0.2s,
      opacity 0.2s;
  }

  .right:dir(rtl) {
    margin-right: auto;
    margin-left: 0;
  }

  :host(.expanded) .right {
    transform: translateY(50%);
    opacity: 0;
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

  .token-without-balance {
    position: absolute;
    opacity: 0;
    z-index: -1;
    pointer-events: none;
  }

  :host(.show-more-chain) .token-without-balance {
    position: relative;
    opacity: 1;
    z-index: 1;
    pointer-events: all;
  }

  .more-chain-button {
    padding-top: 8px;
    padding-left: 12px;
  }

  .more-chain-button:dir(rtl) {
    padding-right: 12px;
  }

  .less-more-icon-container {
    position: relative;
    width: 24px;
    height: 24px;
  }

  .less-more-icon {
    position: absolute;
    transition:
      opacity 0.2s,
      transform 0.2s;
  }

  .less-icon {
    opacity: 0;
  }

  .more-icon {
    opacity: 1;
  }

  :host(.show-more-chain) .less-icon {
    opacity: 1;
  }

  :host(.show-more-chain) .more-icon {
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
`
