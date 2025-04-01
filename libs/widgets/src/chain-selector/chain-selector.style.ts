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

    border: 2px solid var(--color-background-bg-body);
    border-radius: 50%;

    transition: all 0.2ms;
  }

  .icon-0 {
    z-index: 1;
  }

  .icon-1 {
    z-index: 2;
  }

  .icon-2 {
    z-index: 3;
  }

  .icon-3 {
    z-index: 4;
  }

  .capacity-2 .icon-0 {
    top: -2px;
    left: -2px;
  }

  .capacity-2 .icon-1 {
    right: -2px;
    bottom: -2px;
  }

  .capacity-3 .icon-0 {
    top: -2px;
    left: 4px;
  }

  .capacity-3 .icon-1 {
    left: -2px;
    bottom: -2px;
  }

  .capacity-3 .icon-2 {
    right: -2px;
    bottom: -2px;
  }

  .capacity-4 .icon-1 {
    top: -2px;
    left: -2px;
  }

  .capacity-4 .icon-0 {
    top: -2px;
    right: -2px;
  }

  .capacity-4 .icon-2 {
    left: -2px;
    bottom: -2px;
  }

  .capacity-4 .icon-3 {
    right: -2px;
    bottom: -2px;
  }

  .capacity-5 .icon-common {
    border: none;
  }

  .capacity-5 .icon-1 {
    top: 2px;
    left: 9px;
  }

  .capacity-5 .icon-0 {
    top: 8px;
    right: 2px;
  }

  .capacity-5 .icon-4 {
    right: 4px;
    bottom: 2px;
  }

  .capacity-5 .icon-3 {
    left: 4px;
    bottom: 2px;
  }

  .capacity-5 .icon-2 {
    top: 8px;
    left: 2px;
  }

  .capacity-6 .icon-common {
    border: none;
  }

  .capacity-6 .icon-2 {
    top: 1px;
    left: 5px;
  }

  .capacity-6 .icon-1 {
    top: 1px;
    right: 5px;
  }

  .capacity-6 .icon-0 {
    top: 8px;
    right: 1px;
  }

  .capacity-6 .icon-5 {
    right: 5px;
    bottom: 2px;
  }

  .capacity-6 .icon-4 {
    left: 5px;
    bottom: 2px;
  }

  .capacity-6 .icon-3 {
    top: 8px;
    left: 1px;
  }

  .unsupported {
    color: var(--color-core-red-critical);
  }
`
