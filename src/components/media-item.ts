import { css, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { CardConfig, MediaPlayerItem } from '../types';
import { stylable } from '../utils';

export abstract class MediaItem extends LitElement {
  @property() mediaItem!: MediaPlayerItem;
  @property() config!: CardConfig;

  getThumbnail() {
    let thumbnail = this.mediaItem.thumbnail;
    if (!thumbnail) {
      thumbnail = this.config.customThumbnailIfMissing?.[this.mediaItem.title] || '';
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
      border: 'var(--sonos-int-border-width) solid var(--sonos-int-color)',
      display: 'flex',
      borderRadius: 'var(--sonos-int-border-radius)',
      backgroundColor: 'var(--sonos-int-background-color)',
    };
  }

  wrapperStyle() {
    return stylable('media-button-wrapper', this.config, {
      padding: '0 0.1rem 0.3rem 0.1rem',
    });
  }

  folderStyle(thumbnail: string) {
    return stylable('media-button-folder', this.config, {
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
