import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { CardConfig, MediaPlayerItem } from '../types';
import { styleMap } from 'lit-html/directives/style-map.js';
import { dispatchMediaItemSelected, getThumbnail } from '../utils';

const BUTTON_SIZE = '110px';
const THUMB_SIZE = '90px';
class MediaBrowserListIcon extends LitElement {
  @property() mediaItem!: MediaPlayerItem;
  @property() config!: CardConfig;
  @property() itemsWithImage!: boolean;

  private iconStyle = {
    position: 'relative',
    flexShrink: '0',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
  };

  render() {
    const thumbnail = getThumbnail(this.mediaItem, this.config, this.itemsWithImage);
    const itemClick = () => dispatchMediaItemSelected(this.mediaItem);

    return html`
      <ha-control-button style="${this.thumbnailStyle(thumbnail)}" @click="${itemClick}">
        <ha-icon style="${this.folderStyle(thumbnail)}" .icon=${'mdi:folder-music'}></ha-icon>
        <div style="${this.titleStyle(thumbnail)}">${this.mediaItem.title}</div>
      </ha-control-button>
    `;
  }

  private thumbnailStyle(thumbnail: string) {
    return styleMap({
      // ...this.iconStyle,
      backgroundSize: THUMB_SIZE,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
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

customElements.define('sonos-media-browser-icon', MediaBrowserListIcon);
