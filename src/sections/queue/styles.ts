import { css } from 'lit';
import { sectionCommonStyles } from '../section-common.styles';

export const queueStyles = [
  sectionCommonStyles,
  css`
    /* Queue uses section-container class name */
    .queue-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      outline: none;
      position: relative;
      overflow: hidden;
    }
    .queue-content {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }
    .list.search-active {
      padding-top: 3rem;
    }
    .delete-all-btn {
      display: inline-flex;
      position: relative;
      cursor: pointer;
    }
    .delete-all-btn .all-label {
      position: absolute;
      bottom: -16px;
      left: 63%;
      font-size: 2em;
      font-weight: bold;
      color: var(--secondary-text-color);
      pointer-events: none;
      -webkit-text-stroke: 0.5px black;
      text-shadow: 0 0 2px black;
    }
    .error-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 1rem;
      text-align: center;
      color: var(--secondary-text-color);
    }
    .error-message p {
      margin: 0;
      line-height: 1.5;
    }
  `,
];
