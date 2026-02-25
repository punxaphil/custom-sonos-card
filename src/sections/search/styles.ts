import { css } from 'lit';
import { sectionCommonStyles } from '../section-common.styles';

export const searchStyles = [
  sectionCommonStyles,
  css`
    /* Search uses section-container class name */
    .search-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      outline: none;
      position: relative;
    }
    .media-type-icons {
      display: flex;
      gap: 0;
      align-items: center;
    }
    .media-type-icons ha-icon-button[selected] {
      color: var(--accent-color);
    }
    .separator {
      width: 1px;
      height: 24px;
      background: var(--divider-color, rgba(255, 255, 255, 0.12));
      margin: 0 4px;
    }
    .library-filter-btn {
      display: inline-flex;
      position: relative;
      cursor: pointer;
    }
    .library-filter-btn ha-icon-button[selected] {
      color: var(--accent-color);
    }
    .library-filter-btn .overlay-icon {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 14px;
      height: 14px;
      fill: var(--accent-color);
      pointer-events: none;
    }
    .search-bar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--secondary-background-color);
      margin: 0 0.5rem;
      border-radius: 0.5rem;
    }
    .search-bar input {
      flex: 1;
      border: none;
      background: transparent;
      color: var(--primary-text-color);
      font-size: 1rem;
      outline: none;
      padding: 0.5rem;
    }
    .search-bar input::placeholder {
      color: var(--secondary-text-color);
    }
    .config-required {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 2rem;
      text-align: center;
      color: var(--secondary-text-color);
    }
    .config-required ha-icon {
      --mdc-icon-size: 48px;
      margin-bottom: 1rem;
      opacity: 0.5;
    }
    .config-required .title {
      font-size: 1.2rem;
      margin-bottom: 0.5rem;
      color: var(--primary-text-color);
    }
    .browse-header {
      display: flex;
      align-items: center;
      gap: 0;
      padding: 0 0.25rem;
    }
    .browse-title {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 1rem;
      font-weight: 500;
    }
    .type-indicator {
      opacity: 0.4;
      pointer-events: none;
    }
    .filter-menu-anchor {
      position: relative;
      display: inline-flex;
    }
    .filter-menu-anchor ha-icon-button[selected] {
      color: var(--accent-color);
    }
    .filter-menu {
      position: absolute;
      top: 100%;
      right: 0;
      z-index: 10;
      background: var(--card-background-color, var(--primary-background-color));
      border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      min-width: 180px;
      padding: 4px 0;
    }
    .filter-menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      cursor: pointer;
      color: var(--primary-text-color);
      font-size: 0.9rem;
    }
    .filter-menu-item:hover {
      background: var(--secondary-background-color);
    }
    .filter-menu-item ha-svg-icon {
      --mdc-icon-size: 20px;
      flex-shrink: 0;
    }
    .filter-menu-item span {
      flex: 1;
    }
    .filter-menu-item .check {
      --mdc-icon-size: 18px;
      color: var(--accent-color);
    }
    .filter-menu-divider {
      height: 1px;
      background: var(--divider-color, rgba(255, 255, 255, 0.12));
      margin: 4px 0;
    }
    .filter-menu-done {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px 16px;
      cursor: pointer;
      color: var(--accent-color);
      font-size: 0.9rem;
      font-weight: 500;
    }
    .filter-menu-done:hover {
      background: var(--secondary-background-color);
    }
  `,
];

export const searchResultsStyles = [sectionCommonStyles];
