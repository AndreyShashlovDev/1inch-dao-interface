import { css, unsafeCSS } from 'lit'

export const getScrollbarStyle = (hostName: string, hideScrollBar?: boolean) => css`
  ${unsafeCSS(hostName)} {
    overflow: auto;
    touch-action: pan-y;
    overscroll-behavior: none;
    scrollbar-color: var(--primary) transparent;
    scrollbar-width: ${unsafeCSS(hideScrollBar ? 'none' : 'thin')};
    scrollbar-gutter: stable;
  }
`

export const scrollbarStyle = getScrollbarStyle(':host')
