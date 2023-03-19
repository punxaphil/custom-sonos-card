import { css, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { CardConfig, DEFAULT_MEDIA_THUMBNAIL, MediaPlayerItem } from '../types';
import { stylable } from '../utils';

export abstract class MediaItem extends LitElement {
  @property() mediaItem!: MediaPlayerItem;
  @property() config!: CardConfig;
  @property() itemsWithImage!: boolean;

  getThumbnail() {
    let thumbnail = this.mediaItem.thumbnail;
    if (!thumbnail) {
      thumbnail = this.config.customThumbnailIfMissing?.[this.mediaItem.title] || '';
      if (this.itemsWithImage && !thumbnail) {
        thumbnail = this.config.customThumbnailIfMissing?.['default'] || DEFAULT_MEDIA_THUMBNAIL;
      }
    } else if (thumbnail?.match(/https:\/\/brands.home-assistant.io\/.+\/logo.png/)) {
      thumbnail = thumbnail?.replace('logo.png', 'icon.png');
    }
    return thumbnail;
  }

  mediaButtonStyle() {
    return {
      boxSizing: 'border-box',
      '-moz-box-sizing': 'border-box',
      '-webkit-box-sizing': 'border-box',
      overflow: 'hidden',
      display: 'flex',
      backgroundColor: 'var(--sonos-int-background-color)',
    };
  }

  wrapperStyle() {
    return stylable('media-button-wrapper', this.config, {
      padding: '0 0.1rem 0.3rem 0.1rem',
    });
  }

  static get styles() {
    return css`
      .hoverable:focus,
      .hoverable:hover {
        color: var(--sonos-int-accent-color);
      }
      .hoverable:active {
        color: var(--primary-color);
        border-color: var(--primary-color);
      }
    `;
  }
}
