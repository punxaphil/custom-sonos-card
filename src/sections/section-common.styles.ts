import { css } from 'lit';

/**
 * Common styles shared between Queue and Search sections
 */
export const sectionCommonStyles = css`
  [hidden] {
    display: none !important;
  }
  :host {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .section-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    outline: none;
    position: relative;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    position: relative;
  }
  .header-icons {
    white-space: nowrap;
    display: flex;
    align-items: center;
  }
  .header-icons > * {
    display: inline-block;
  }
  .title-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
    padding: 0.5rem;
  }
  .title {
    font-size: calc(var(--sonos-font-size, 1rem) * 1.2);
    font-weight: bold;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .item-count {
    font-size: calc(var(--sonos-font-size, 1rem) * 0.9);
    color: var(--secondary-text-color);
    flex-shrink: 0;
  }
  .list {
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;
    flex: 1;
    --icon-button-size: 1.5em;
    --icon-size: 1em;
  }
  sonos-icon-button[selected] {
    color: var(--accent-color);
  }
  .loading {
    display: flex;
    justify-content: center;
    padding: 2rem;
  }
  .no-results {
    text-align: center;
    padding: 2rem;
    color: var(--secondary-text-color);
  }
  .error-message {
    text-align: center;
    padding: 2rem;
    color: var(--error-color, #db4437);
  }
  .play-menu-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.3);
  }
`;
