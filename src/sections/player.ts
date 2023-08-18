import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import '../components/player-controls';
import '../components/player-header';
import '../components/progress';
import '../components/volume';

import { HassEntity } from 'home-assistant-js-websocket';
import Store from '../store';
import { CardConfig } from '../types';

import { MUSIC_NOTES_BASE64_IMAGE, TV_BASE64_IMAGE } from '../constants';

export class Player extends LitElement {
  @property() store!: Store;
  private config!: CardConfig;
  private entityId!: string;
  private entity!: HassEntity;

  render() {
    ({ config: this.config, entity: this.entity, entityId: this.entityId } = this.store);
    return html`
      <div class="row">
        <sonos-player-header .store=${this.store}></sonos-player-header>
        <div class="artwork" style="background-image: ${this.getBackgroundImage()}"></div>
        <sonos-player-controls style="overflow-y:auto" .store=${this.store}></sonos-player-controls>
      </div>
    `;
  }

  private getBackgroundImage() {
    let backgroundImage = `url(${
      this.entity.attributes.media_title === 'TV' ? TV_BASE64_IMAGE : MUSIC_NOTES_BASE64_IMAGE
    })`;
    const image = this.getArtworkImage();
    if (image) {
      backgroundImage = `url(${image}), ${backgroundImage}`;
    }
    return backgroundImage;
  }

  private getArtworkImage() {
    const prefix = this.config.artworkHostname || '';
    const { media_title, media_content_id, entity_picture } = this.entity.attributes;
    let entityImage = entity_picture ? prefix + entity_picture : entity_picture;
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
      }
    }
    return entityImage;
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

      .row {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 100%;
      }

      .artwork {
        align-self: center;
        flex-grow: 1;
        flex-shrink: 0;
        width: 100%;
        background-position: center;
        background-repeat: no-repeat;
        background-size: contain;
      }
    `;
  }
}
