import { css, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { CardConfig, MediaPlayerItem } from '../types';
import { CustomSonosCard } from '../main';

export abstract class MediaItem extends LitElement {
  @property() mediaItem!: MediaPlayerItem;
  @property() config!: CardConfig;
  @property() main!: CustomSonosCard;

  getThumbnail() {
    let thumbnail = this.mediaItem.thumbnail;
    if (!thumbnail) {
      thumbnail = this.config.customThumbnailIfMissing?.[this.mediaItem.title] || '';
    } else if (thumbnail?.match(/https:\/\/brands.home-assistant.io\/.+\/logo.png/)) {
      thumbnail = thumbnail?.replace('logo.png', 'icon.png');
    }
    return thumbnail;
  }
  wrapperStyle() {
    return this.main.stylable('media-button-wrapper', {
      padding: '0 0.3rem 0.6rem 0.3rem',
    });
  }

  folderStyle(thumbnail: string) {
    return this.main.stylable('media-button-folder', {
      marginBottom: '-120%',
      '--mdc-icon-size': '1',
      ...((!this.mediaItem.can_expand || thumbnail) && { display: 'none' }),
    });
  }

  static get styles() {
    return css`
      .hoverable:focus,
      .hoverable:hover {
        border-color: var(--sonos-int-accent-color);
        color: var(--sonos-int-accent-color);
      }
    `;
  }
}
