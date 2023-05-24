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
import { styleMap } from 'lit-html/directives/style-map.js';

export class Player extends LitElement {
  @property() store!: Store;
  private config!: CardConfig;
  private entityId!: string;
  private entity!: HassEntity;

  render() {
    ({ config: this.config, entity: this.entity, entityId: this.entityId } = this.store);
    return html`
      <div style="${this.bodyStyle()}">
        <sonos-player-header .store=${this.store}></sonos-player-header>
        <div style="${this.artworkStyle()}"></div>
        <sonos-player-controls style="overflow-y:auto" .store=${this.store}></sonos-player-controls>
      </div>
    `;
  }

  private bodyStyle() {
    return styleMap({
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: '100%',
    });
  }

  private artworkStyle() {
    return styleMap({
      alignSelf: 'center',
      flexGrow: '1',
      flexShrink: '0',
      width: '100%',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'contain',
      backgroundImage: this.getBackgroundImage(),
    });
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
    return [
      css`
        .hoverable:focus,
        .hoverable:hover {
          color: var(--accent-color);
        }
        .hoverable:active {
          color: var(--primary-color);
        }
      `,
    ];
  }
}
