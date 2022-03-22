import { css } from 'lit-element';

const sharedStyle = css`
  .button-section-background {
    background: var(--sonos-int-button-section-background-color);
    border-radius: var(--sonos-int-border-radius);
    border: var(--sonos-int-border-width) solid var(--sonos-int-color);
    margin-top: 1rem;
    padding: 0 0.5rem;
  }
  .title {
    margin: 0.5rem 0;
    text-align: center;
    font-weight: bold;
    font-size: larger;
    color: var(--sonos-int-title-color);
  }
`;

export default sharedStyle;
