import { css, html, LitElement } from 'lit';
import { stylable } from '../utils';
import { property } from 'lit/decorators.js';
import { CardConfig, DEFAULT_MEDIA_THUMBNAIL, MediaPlayerItem } from '../types';

const THUMB_SIZE = '44px';
class MediaListItem extends LitElement {
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

  private iconStyle = {
    position: 'relative',
    flexShrink: '0',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
  };

  render() {
    const thumbnail = this.getThumbnail();
    return html`
      <div style="${this.thumbnailStyle(thumbnail)}"></div>
      <ha-icon style="${this.folderStyle(thumbnail)}" .icon=${'mdi:folder-music'}></ha-icon>
      <div style="${this.titleStyle(thumbnail)}">${this.mediaItem.title}</div>
    `;
  }

  private thumbnailStyle(thumbnail: string) {
    return stylable('media-button-thumb', this.config, {
      ...this.iconStyle,
      backgroundSize: THUMB_SIZE,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'left',
      backgroundImage: 'url(' + thumbnail + ')',
      ...(!thumbnail && { display: 'none' }),
    });
  }

  private folderStyle(thumbnail: string) {
    return stylable('media-button-folder', this.config, {
      ...this.iconStyle,
      '--mdc-icon-size': '90%',
      ...((!this.mediaItem.can_expand || thumbnail) && { display: 'none' }),
    });
  }

  private titleStyle(thumbnail: string) {
    return stylable('media-button-title', this.config, {
      fontSize: '1.2rem',
      padding: '0px 0.5rem',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      alignSelf: 'center',
      flex: '1',
      ...((thumbnail || this.mediaItem.can_expand) && {
        zIndex: '1',
      }),
    });
  }

  static get styles() {
    return css`
      :host {
        display: flex;
      }
    `;
  }
}

customElements.define('dev-sonos-media-list-item', MediaListItem);
