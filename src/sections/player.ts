import { css, html, LitElement } from 'lit';
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

    return html`
      <div class="container">
        <sonos-player-header class="header" .store=${this.store}></sonos-player-header>
        <div class="artwork" style="${this.getBackgroundImage()}"></div>
        <sonos-player-controls class="controls" .store=${this.store}></sonos-player-controls>
      </div>
    `;
  }

  private getBackgroundImage() {
    const backgroundImage = `url(${
      this.activePlayer.attributes.media_title === 'TV' ? TV_BASE64_IMAGE : MUSIC_NOTES_BASE64_IMAGE
    })`;
    const image = this.getArtworkImage();
    if (image) {
      return `background-image: url(${image.entityImage}), ${backgroundImage}${
        image.sizePercentage ? `; background-size: ${image.sizePercentage}%` : ''
      }`;
    } else {
      return `background-image: ${backgroundImage}`;
    }
  }

  private getArtworkImage() {
    const prefix = this.config.artworkHostname || '';
    const { media_title, media_content_id, entity_picture } = this.activePlayer.attributes;
    let entityImage = entity_picture ? prefix + entity_picture : entity_picture;
    let sizePercentage = undefined;
    const overrides = this.config.mediaArtworkOverrides;
    if (overrides) {
      let override = overrides.find(
        (value) =>
          (media_title && media_title === value.mediaTitleEquals) ||
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
      }

      .header {
        grid-area: header;
      }

      .controls {
        grid-area: controls;
        overflow-y: auto;
      }

      .artwork {
        grid-area: artwork;
        align-self: center;
        flex-grow: 1;
        flex-shrink: 0;
        width: 100%;
        height: 100%;
        background-position: center;
        background-repeat: no-repeat;
        background-size: contain;
      }
    `;
  }
}
