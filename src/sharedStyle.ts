import { css } from 'lit';

export default css`
  :host {
    --sonos-int-background-color: var(--sonos-background-color, transparent);
    --sonos-int-ha-card-background-color: var(
      --sonos-ha-card-background-color,
      var(--ha-card-background, var(--card-background-color, white))
    );
    --sonos-int-player-section-background: var(--sonos-player-section-background, #ffffffe6);
    --sonos-int-color: var(--sonos-color, var(--secondary-text-color));
    --sonos-int-artist-album-text-color: var(--sonos-artist-album-text-color, var(--secondary-text-color));
    --sonos-int-song-text-color: var(--sonos-song-text-color, var(--sonos-accent-color, var(--accent-color)));
    --sonos-int-accent-color: var(--sonos-accent-color, var(--accent-color));
    --sonos-int-title-color: var(--sonos-title-color, var(--secondary-text-color));
    --sonos-int-border-radius: var(--sonos-border-radius, 0.25rem);
    --sonos-int-border-width: var(--sonos-border-width, 0rem);
    --sonos-int-media-button-white-space: var(
      --sonos-media-buttons-multiline,
      var(--sonos-favorites-multiline, nowrap)
    );
    --sonos-int-button-section-background-color: var(--sonos-button-section-background-color, transparent);
  }

  .sonos-icon-button {
    margin-bottom: 0.4rem;
  }
`;
