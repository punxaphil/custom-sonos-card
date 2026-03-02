import { css } from 'lit';
import { listStyle } from '../../constants';

export const groupingSectionStyles = [
  listStyle,
  css`
    :host {
      --mdc-icon-size: 24px;
    }
    .wrapper {
      display: flex;
      flex-direction: column;
      height: 100%;
      position: relative;
    }
    .list {
      flex: 1;
      overflow: auto;
    }
    .buttons {
      flex-shrink: 0;
      margin: 0 1rem;
      padding-top: 0.5rem;
    }
    .apply {
      --control-button-background-color: var(--accent-color);
    }
    [hidden] {
      display: none !important;
    }
    .applying {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      background: rgba(0, 0, 0, 0.3);
      z-index: 10;
      pointer-events: none;
    }
  `,
];
