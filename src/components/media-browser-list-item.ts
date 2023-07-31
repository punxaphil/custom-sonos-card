import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { CardConfig, MediaPlayerItem } from '../types';
import { DEFAULT_MEDIA_THUMBNAIL } from '../constants';
import { styleMap } from 'lit-html/directives/style-map.js';

const THUMB_SIZE = '35px';
class MediaBrowserListItem extends LitElement {
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
      <div class="thumbnail" style="${this.thumbnailStyle(thumbnail)}"></div>
      <ha-icon class="folder" style="${this.folderStyle(thumbnail)}" .icon=${'mdi:folder-music'}></ha-icon>
      <div class="title" style="${this.titleStyle(thumbnail)}">${this.mediaItem.title}</div>
    `;
  }

  private thumbnailStyle(thumbnail: string) {
    return styleMap({
      ...this.iconStyle,
      backgroundSize: THUMB_SIZE,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'left',
      backgroundImage: 'url(' + thumbnail + ')',
      ...(!thumbnail && { display: 'none' }),
    });
  }

  private folderStyle(thumbnail: string) {
    return styleMap({
      ...this.iconStyle,
      '--mdc-icon-size': '90%',
      ...((!this.mediaItem.can_expand || thumbnail) && { display: 'none' }),
    });
  }

  private titleStyle(thumbnail: string) {
    return styleMap({
      fontSize: '1.1rem',
      color: 'var(--secondary-text-color)',
      fontWeight: 'bold',
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

customElements.define('sonos-media-browser-list-item', MediaBrowserListItem);
