import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import '../components/player-controls';
import '../components/player-header';
import '../components/progress';
import '../components/volume';

import Store from '../model/store';
import { CardConfig } from '../types';

import { MUSIC_NOTES_BASE64_IMAGE, TV_BASE64_IMAGE } from '../constants';
import { MediaPlayer } from '../model/media-player';

export class Player extends LitElement {
  @property({ attribute: false }) store!: Store;
  private config!: CardConfig;
  private activePlayer!: MediaPlayer;

  render() {
    this.config = this.store.config;
    this.activePlayer = this.store.activePlayer;

    const artworkAsBackground = this.config.artworkAsBackground;
    return html`
      <div class="container" style=${artworkAsBackground && this.getBackgroundImage()}>
        <sonos-player-header
          class="header"
          background=${artworkAsBackground || nothing}
          .store=${this.store}
        ></sonos-player-header>
        <div class="artwork" hide=${artworkAsBackground || nothing} style=${this.artworkStyle()}></div>
        <sonos-player-controls
          class="controls"
          background=${artworkAsBackground || nothing}
          .store=${this.store}
        ></sonos-player-controls>
      </div>
    `;
  }

  private artworkStyle() {
    const minHeight = this.config.artworkMinHeight ?? 5;
    return `${this.getBackgroundImage()}; min-height: ${minHeight}rem`;
  }

  private getBackgroundImage() {
    const fallbackImage =
      this.config.fallbackArtwork ??
      (this.activePlayer.attributes.media_title === 'TV' ? TV_BASE64_IMAGE : MUSIC_NOTES_BASE64_IMAGE);
    const fallbackBackgroundUrl = `url(${fallbackImage})`;
    const image = this.getArtworkImage();
    if (image) {
      return `background-image: url(${image.entityImage}), ${fallbackBackgroundUrl}${
        image.sizePercentage ? `; background-size: ${image.sizePercentage}%` : ''
      }`;
    } else {
      return `background-image: ${fallbackBackgroundUrl}`;
    }
  }

  private getArtworkImage() {
    const prefix = this.config.artworkHostname || '';
    const { media_title, media_artist, media_album_name, media_content_id, media_channel, entity_picture, entity_picture_local, app_id } =
      this.activePlayer.attributes;
    let entityImage = entity_picture ? prefix + entity_picture : entity_picture;
    if (app_id === 'music_assistant') {
      entityImage = entity_picture_local ? prefix + entity_picture_local : entity_picture;
    }
    let sizePercentage = undefined;
    const overrides = this.config.mediaArtworkOverrides;
    if (overrides) {
      let override = overrides.find(
        (value) =>
          (media_title && media_title === value.mediaTitleEquals) ||
          (media_artist && media_artist === value.mediaArtistEquals) ||
          (media_album_name && media_album_name === value.mediaAlbumNameEquals) ||
          (media_channel && media_channel === value.mediaChannelEquals) ||
          (media_content_id && media_content_id === value.mediaContentIdEquals),
      );
      if (!override) {
        override = overrides.find((value) => !entityImage && value.ifMissing);
      }
      if (override?.imageUrl) {
        entityImage = override.imageUrl;
        sizePercentage = override?.sizePercentage ?? sizePercentage;
      }
    }
    return { entityImage, sizePercentage };
  }

  static get styles() {
    return css`
      .hoverable:focus,
      .hoverable:hover {
        color: var(--accent-color);
      }

      .hoverable:active {
        color: var(--primary-color);
      }

      .container {
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

      .header {
        grid-area: header;
        margin: 0.75rem 3.25rem;
        padding: 0.5rem;
      }

      .controls {
        grid-area: controls;
        overflow-y: auto;
        margin: 0.25rem;
        padding: 0.5rem;
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
      }

      *[hide] {
        display: none;
      }

      *[background] {
        background-color: rgba(var(--rgb-card-background-color), 0.9);
        border-radius: 10px;
      }
    `;
  }
}
