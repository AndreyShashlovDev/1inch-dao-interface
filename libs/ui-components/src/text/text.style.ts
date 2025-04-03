import { css } from 'lit'

export const textStyle = css`
  :host {
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition:
      height 0.2s,
      width 0.2s;
  }

  .text {
    white-space: nowrap;
  }

  .new-text {
    position: absolute;
    transform: translateY(-100%);
    opacity: 0;
  }
`
