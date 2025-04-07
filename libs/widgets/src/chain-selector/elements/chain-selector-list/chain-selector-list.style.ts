import { css } from 'lit'

export const chainSelectorListStyle = css`
  :host {
    display: flex;
    width: 100%;
    min-width: 320px;
  }

  .scroll-container {
    position: relative;
    height: 100%;
    overflow-y: auto;
  }

  .scroll-overlay {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
  }

  .header {
    position: relative;

    display: flex;
    padding: 8px 8px 16px;
    justify-content: space-between;
  }

  .header::after {
    position: absolute;
    left: -8px;
    bottom: 0;

    display: block;
    width: calc(100% + 16px);
    height: 1px;

    background-color: var(--color-border-border-tertiary);

    content: '';
  }

  .title {
    margin: 0;

    color: var(--color-content-content-primary);
    font-size: 16px;
    font-weight: 500;
  }
`
