import { css } from 'lit';

export const mediaBrowserStyles = css`
  :host {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
  .header {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    border-bottom: 1px solid var(--divider-color);
    background: var(--card-background-color);
  }
  .title {
    flex: 1;
    font-weight: 500;
    font-size: calc(var(--sonos-font-size, 1rem) * 1.1);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: center;
  }
  .title-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    min-width: 0;
    max-width: 100%;
  }
  .title-section .title {
    flex: 0;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }
  .player-name {
    font-size: calc(var(--sonos-font-size, 1rem) * 0.8);
    color: var(--secondary-text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: center;
    max-width: 100%;
  }
  .spacer {
    width: 48px;
  }
  .no-items {
    text-align: center;
    margin-top: 50%;
  }
  sonos-icon-button.startpath-active {
    color: var(--accent-color);
  }
  sonos-icon-button.shortcut-active {
    color: var(--accent-color);
  }
  .play-all-warning {
    padding: 8px 12px;
    background: var(--warning-color, #ffa726);
    color: var(--primary-text-color);
    font-size: 0.85rem;
    text-align: center;
  }
  .loading-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }
  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--secondary-text-color);
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  sonos-ha-media-player-browse,
  sonos-favorites {
    --mdc-icon-size: 24px;
    --media-browse-item-size: 100px;
    flex: 1;
    min-height: 0;
    overflow: auto;
  }
`;
