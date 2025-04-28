import { css } from 'lit'

export const walletViewStyle = css`
  :host {
    display: block;
    transition: height 0.2s;
    overflow: hidden;
    background: var(--color-background-bg-secondary);
    border-radius: 16px;
  }

  .wallet-view-container {
    display: flex;
    align-content: center;
    justify-content: space-between;
    height: 56px;
    box-sizing: border-box;
    padding: 12px;
    transition:
      background-color 0.2s,
      height 0.2s;
    position: relative;
    overflow: hidden;
    color: var(--color-content-content-primary);
    cursor: pointer;
  }

  .wallet-view-recent {
    color: var(--primary);
    font-weight: 600;
    font-size: 12px;
    line-height: 16px;
    letter-spacing: 0;
    vertical-align: middle;
    border-radius: 8px;
    background-color: var(--secondary);
    margin-right: 4px;
    padding: 2px 8px;
  }

  .active-address-check-icon {
    color: var(--primary);
  }

  .wallet-icon {
    width: 32px;
    height: 32px;
  }

  .wallet-name {
    color: var(--color-content-content-primary);
    font-size: 16px;
    font-style: normal;
    font-weight: 400;
    line-height: 24px;
  }

  .wallet-info-container {
    display: flex;
    flex-direction: column;
  }

  .wallet-title {
    color: var(--color-content-content-primary);
    font-size: 16px;
    font-style: normal;
    font-weight: 400;
    line-height: 24px;
  }

  .wallet-sub-title {
    font-family: Inter, sans-serif;
    font-weight: 400;
    font-size: 12px;
    line-height: 16px;
    letter-spacing: 0;
    vertical-align: middle;
    color: var(--color-content-content-secondary);
  }

  .disconnect-address-btn {
    display: block;
    opacity: 0;
    width: 0;
    transform: scale(0);
    overflow: hidden;
    transition: transform 0.2s ease-out;
  }

  .disconnect-address-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--color-core-red-critical);
    width: 24px;
    height: 24px;
  }

  .data-container {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .loader-icon {
    height: 24px;
    width: 24px;
    margin-left: auto;
  }

  .address-list {
    display: flex;
    flex-direction: column;
  }

  .add-connection {
    transition: transform 0.2s;
    transform: scale(0);
  }

  .disconnect-address-icon:dir(rtl) {
    transform: scale(-1, 1);
  }

  .sub-wallet-icon:dir(rtl) {
    transform: scale(-1, 1);
  }

  .right-data {
    gap: 0;
    transition: gap 0.2s ease-out;
  }

  @media (hover: hover) {
    .wallet-view-container:hover .connect-icon {
      transform: scale(1);
    }

    .wallet-view-container:hover .right-data {
      gap: 12px;
    }

    .wallet-view-container:hover .disconnect-address-btn {
      opacity: 1;
      width: auto;
      transform: scale(1);
    }

    .wallet-view-container:hover .add-connection {
      transform: scale(1);
    }
  }

  @media (hover: none) {
    .add-connection {
      transform: scale(1);
    }

    .add-connection {
      transform: scale(1);
    }

    .right-data {
      gap: 12px;
    }

    .disconnect-address-btn {
      opacity: 1;
      width: auto;
      transform: scale(1);
    }
  }

  @keyframes rainbow {
    0% {
      background-position: 0;
    }
    100% {
      background-position: 100%;
    }
  }
`
