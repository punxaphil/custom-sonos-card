import { css } from 'lit';

export const queueSearchStyles = css`
  :host {
    display: contents;
  }
  :host > ha-icon-button[selected] {
    color: var(--accent-color);
  }
  .search-row {
    display: flex;
    align-items: center;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    padding: 0.5rem;
    background: var(--card-background-color, #1c1c1c);
    border-bottom: 1px solid var(--divider-color, #e0e0e0);
    z-index: 10;
  }
  input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid var(--divider-color, #ccc);
    border-radius: 4px;
    font-size: var(--sonos-font-size, 1rem);
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color, #000);
  }
  input:focus {
    outline: none;
    border-color: var(--accent-color, #03a9f4);
  }
  input.no-match {
    border-color: var(--error-color, red);
  }
  .match-info {
    padding: 0 0.5rem;
    font-size: calc(var(--sonos-font-size, 1rem) * 0.9);
    color: var(--secondary-text-color, #666);
    white-space: nowrap;
  }
  .search-row ha-icon-button {
    --mdc-icon-button-size: 2rem;
    --mdc-icon-size: 1.2rem;
  }
  .search-row ha-icon-button[selected] {
    color: var(--accent-color);
  }
`;
