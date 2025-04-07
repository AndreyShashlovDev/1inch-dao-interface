import { css } from 'lit'

export const chainSelectorStyle = css`
  .icon-container {
    position: relative;
    width: 24px;
    height: 24px;
    background-color: transparent;
    overflow: hidden;
  }

  .icon-item-container {
    position: absolute;
    border-radius: 50%;
    transition:
      transform 0.2s,
      opacity 0.2s;
  }

  .icon-item {
    transition: opacity 0.2s;
  }
`
