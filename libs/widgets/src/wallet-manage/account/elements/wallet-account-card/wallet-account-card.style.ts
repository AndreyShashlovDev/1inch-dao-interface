import { css } from 'lit'

export const walletAccountCardStyle = css`
  :host {
    width: 100%;
  }

  .loader {
    will-change: filter;
    height: 20px;
    width: 50% !important;
    background-color: var(--color-background-bg-secondary) !important;
    border-radius: 4px;
    animation: stub-loader-animation 3s ease-in-out infinite;
  }

  @keyframes stub-loader-animation {
    0%,
    100% {
      filter: opacity(1);
    }
    50% {
      filter: opacity(0.5);
    }
  }

  .card {
    display: flex;
    gap: 28px;
    flex-direction: column;
    padding: 16px;
    width: 100%;
    height: fit-content;
    background: linear-gradient(14deg, rgba(0, 0, 0, 0.7) 11%, rgba(0, 0, 0, 0) 85%), var(--primary-hover);
    border-radius: 16px;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
  }

  .card-wallet-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-wallet {
    background-color: var(--secondary);
    display: flex;
    gap: 8px;
    padding: 8px;
    border-radius: 8px;
    box-sizing: border-box;
    width: fit-content(50%);
    height: 40px;
    flex-shrink: 0;
    flex-grow: 0;
  }

  .card-wallet-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 4px;
    width: 24px;
    height: 24px;
    overflow: hidden;
    background-color: white;
    padding: 4px;
    box-sizing: border-box;

    .wallet-icon {
      width: 100%;
      height: auto;
    }
  }

  .card-wallet-address {
    color: var(--color-core-white);
    font-size: 16px;
    line-height: 24px;
    font-weight: 500;
    letter-spacing: 0;
  }

  .card-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 0;
    background-color: var(--secondary);
    border-radius: 12px;
    overflow: hidden;
  }

  .btn-send-icon-arrow {
    color: white;
    transform: rotate(-49deg);
    width: 16px;
    height: auto;
  }

  .btn-receive-icon-arrow {
    color: white;
    transform: rotate(138deg);
    width: 16px;
    height: auto;
  }

  .background-unicorn {
    position: absolute;
    right: 0;
    top: 0;
  }
`
