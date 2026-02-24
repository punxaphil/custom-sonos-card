import { css } from 'lit';
import { listStyle } from '../../constants';
import { sectionCommonStyles } from '../section-common.styles';

export const searchStyles = [
  sectionCommonStyles,
  css`
    [hidden] {
      display: none !important;
    }
    .search-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      outline: none;
      position: relative;
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
    .loading {
      display: flex;
      justify-content: center;
      padding: 2rem;
    }
  `,
];

export const searchResultsStyles = [
  listStyle,
  css`
    [hidden] {
      display: none !important;
    }
    .loading {
      display: flex;
      justify-content: center;
      padding: 2rem;
    }
    .no-results,
    .error-message {
      text-align: center;
      padding: 2rem;
      color: var(--secondary-text-color);
    }
    .play-menu-overlay {
      position: fixed;
      inset: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.3);
    }
  `,
];
