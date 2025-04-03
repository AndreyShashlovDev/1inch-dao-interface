import { css } from 'lit'

export const chainSelectorStyle = css`
  .icon-container {
    position: relative;
    width: 24px;
    height: 24px;
    background-color: transparent;
    overflow: hidden;
  }

  .icon-common {
    position: absolute;
    border-radius: 50%;
    transition: all 0.2ms;
  }
`
