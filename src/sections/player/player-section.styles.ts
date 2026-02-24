import { css } from 'lit';

export const playerSectionStyles = css`
  .container {
    position: relative;
    display: grid;
    grid-template-columns: 100%;
    grid-template-rows: min-content auto min-content;
    grid-template-areas:
      'header'
      'artwork'
      'controls';
    min-height: 100%;
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
  }

  .container.blurred-background {
    background: none;
    isolation: isolate;
    overflow: hidden;
  }

  .container.blurred-background::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: var(--blur-background-image);
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
    filter: blur(var(--blur-amount));
    transform: scale(1.1);
    z-index: -1;
  }

  .header {
    grid-area: header;
    margin: 0.75rem 1.25rem;
    padding: 0.5rem;
    position: relative;
  }

  .controls {
    grid-area: controls;
    overflow-y: auto;
    margin: 0.25rem;
    padding: 0.5rem;
    position: relative;
  }

  .artwork {
    grid-area: artwork;
    align-self: center;
    flex-grow: 1;
    flex-shrink: 0;
    width: 100%;
    height: 100%;
    min-height: 5rem;
    background-position: center;
    background-repeat: no-repeat;
    background-size: contain;
    position: relative;
  }

  [hidden] {
    display: none !important;
  }

  *[background] {
    background-color: var(
      --background-overlay-color,
      rgba(var(--rgb-card-background-color), var(--background-opacity, 0.9))
    );
    border-radius: 10px;
  }
`;
